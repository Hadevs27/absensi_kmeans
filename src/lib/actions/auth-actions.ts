"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { compare } from "bcryptjs";

import { createSession, destroySession } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { activityLogs, users } from "@/lib/db/schema";

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    redirect("/login?error=Lengkapi email dan password");
  }

  const rows = await db.select().from(users).where(eq(users.email, email)).limit(1);
  const user = rows[0];

  if (!user || !user.active || !(await compare(password, user.passwordHash))) {
    redirect("/login?error=Email atau password tidak sesuai");
  }

  await createSession(user.id);
  await db.insert(activityLogs).values({
    userId: user.id,
    action: "login",
    targetType: "session",
    metadataJson: JSON.stringify({ email })
  });

  redirect("/dashboard");
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}
