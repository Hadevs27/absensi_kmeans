"use server";

import { hash } from "bcryptjs";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { activityLogs, users, userRoles } from "@/lib/db/schema";

const createUserSchema = z.object({
  name: z.string().trim().min(2).max(80),
  identifier: z.string().trim().min(2).max(40),
  email: z.string().trim().email().max(120),
  role: z.enum(userRoles),
  department: z.string().trim().min(2).max(80),
  position: z.string().trim().min(2).max(80),
  scheduleId: z.coerce.number().int().positive().optional(),
  password: z.string().min(6).max(80).optional()
});

export async function createUserAction(formData: FormData) {
  const actor = await requireRole(["admin"]);
  const parsed = createUserSchema.safeParse({
    name: formData.get("name"),
    identifier: formData.get("identifier"),
    email: formData.get("email"),
    role: formData.get("role"),
    department: formData.get("department"),
    position: formData.get("position"),
    scheduleId: formData.get("scheduleId") || undefined,
    password: formData.get("password") || undefined
  });

  if (!parsed.success) {
    redirect("/pengguna?notice=Data pengguna belum valid");
  }

  try {
    const passwordHash = await hash(parsed.data.password ?? "user123", 10);
    const created = await db
      .insert(users)
      .values({
        ...parsed.data,
        email: parsed.data.email.toLowerCase(),
        passwordHash,
        scheduleId: parsed.data.scheduleId ?? null
      })
      .returning({ id: users.id });

    await db.insert(activityLogs).values({
      userId: actor.id,
      action: "create_user",
      targetType: "user",
      targetId: created[0].id,
      metadataJson: JSON.stringify({ identifier: parsed.data.identifier })
    });
  } catch {
    redirect("/pengguna?notice=Email atau ID sudah dipakai");
  }

  revalidatePath("/pengguna");
  redirect("/pengguna?notice=Pengguna tersimpan");
}

export async function toggleUserAction(formData: FormData) {
  const actor = await requireRole(["admin"]);
  const userId = Number(formData.get("userId"));
  const active = String(formData.get("active")) === "true";

  if (!Number.isFinite(userId) || userId === actor.id) {
    redirect("/pengguna?notice=Pengguna tidak dapat diubah");
  }

  await db
    .update(users)
    .set({ active: !active, updatedAt: new Date().toISOString() })
    .where(eq(users.id, userId));

  await db.insert(activityLogs).values({
    userId: actor.id,
    action: active ? "deactivate_user" : "activate_user",
    targetType: "user",
    targetId: userId
  });

  revalidatePath("/pengguna");
  redirect("/pengguna?notice=Status pengguna diperbarui");
}
