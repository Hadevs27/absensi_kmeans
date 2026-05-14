"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { holidays, schedules } from "@/lib/db/schema";

const scheduleSchema = z.object({
  name: z.string().trim().min(2).max(80),
  workdays: z.string().trim().min(1).max(20),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  toleranceMinutes: z.coerce.number().int().min(0).max(120)
});

export async function createScheduleAction(formData: FormData) {
  await requireRole(["admin"]);
  const parsed = scheduleSchema.safeParse({
    name: formData.get("name"),
    workdays: formData.get("workdays"),
    startTime: formData.get("startTime"),
    endTime: formData.get("endTime"),
    toleranceMinutes: formData.get("toleranceMinutes")
  });

  if (!parsed.success) {
    redirect("/jadwal?notice=Jadwal belum valid");
  }

  await db.insert(schedules).values(parsed.data);
  revalidatePath("/jadwal");
  redirect("/jadwal?notice=Jadwal tersimpan");
}

const holidaySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  name: z.string().trim().min(2).max(100),
  type: z.string().trim().min(2).max(40)
});

export async function createHolidayAction(formData: FormData) {
  await requireRole(["admin"]);
  const parsed = holidaySchema.safeParse({
    date: formData.get("date"),
    name: formData.get("name"),
    type: formData.get("type")
  });

  if (!parsed.success) {
    redirect("/jadwal?notice=Hari libur belum valid");
  }

  await db
    .insert(holidays)
    .values(parsed.data)
    .onConflictDoUpdate({
      target: holidays.date,
      set: {
        name: parsed.data.name,
        type: parsed.data.type
      }
    });

  revalidatePath("/jadwal");
  redirect("/jadwal?notice=Hari libur tersimpan");
}
