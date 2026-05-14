"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireUser } from "@/lib/auth";
import { getTodayRecord, getUserSchedule } from "@/lib/attendance-metrics";
import { db } from "@/lib/db/client";
import { attendanceRecords, holidays } from "@/lib/db/schema";
import {
  dayOfWeekFromDateKey,
  formatDateKey,
  formatTimeKey,
  timeToMinutes
} from "@/lib/datetime";

async function getHoliday(dateKey: string) {
  const rows = await db.select().from(holidays).where(eq(holidays.date, dateKey)).limit(1);
  return rows[0] ?? null;
}

async function ensureActiveAttendanceDay(userId: number, today: string) {
  const schedule = await getUserSchedule(userId);
  const holiday = await getHoliday(today);

  if (holiday) {
    return `Hari ini ${holiday.name}`;
  }

  if (!schedule) return null;

  const allowedDays = schedule.workdays.split(",").map((item) => Number(item.trim()));
  if (!allowedDays.includes(dayOfWeekFromDateKey(today))) {
    return "Hari ini di luar jadwal aktif";
  }

  return null;
}

function readTextField(formData: FormData | undefined, name: string) {
  const value = formData?.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function readNumberField(formData: FormData | undefined, name: string) {
  const value = readTextField(formData, name);
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function readAttendanceProof(formData: FormData | undefined) {
  const mode = readTextField(formData, "attendanceMode");
  const photo = readTextField(formData, "photoDataUrl");
  const latitude = readNumberField(formData, "latitude");
  const longitude = readNumberField(formData, "longitude");
  const accuracy = readNumberField(formData, "accuracy");
  const clientCapturedAt = readTextField(formData, "clientCapturedAt");
  const hasProofInput = mode === "camera_location" || Boolean(photo || latitude || longitude);

  if (!hasProofInput) {
    return {
      source: "web",
      photo: null,
      latitude: null,
      longitude: null,
      accuracy: null,
      clientCapturedAt: null
    };
  }

  const validPhoto =
    photo.length <= 1_200_000 && /^data:image\/(jpeg|jpg|png|webp);base64,/i.test(photo);
  const validLatitude = latitude !== null && latitude >= -90 && latitude <= 90;
  const validLongitude = longitude !== null && longitude >= -180 && longitude <= 180;
  const validAccuracy = accuracy !== null && accuracy >= 0 && accuracy <= 10000;

  if (!validPhoto || !validLatitude || !validLongitude || !validAccuracy) {
    redirect("/absensi?notice=Bukti kamera atau lokasi belum valid");
  }

  return {
    source: "camera_location",
    photo,
    latitude,
    longitude,
    accuracy,
    clientCapturedAt: clientCapturedAt || null
  };
}

export async function clockAttendanceAction(formData?: FormData) {
  const user = await requireUser();
  const now = new Date();
  const today = formatDateKey(now);
  const blockedMessage = await ensureActiveAttendanceDay(user.id, today);

  if (blockedMessage) {
    redirect(`/absensi?notice=${encodeURIComponent(blockedMessage)}`);
  }

  const [existing, schedule] = await Promise.all([
    getTodayRecord(user.id, today),
    getUserSchedule(user.id)
  ]);

  const proof = readAttendanceProof(formData);
  const nowIso = now.toISOString();
  const currentMinutes = timeToMinutes(formatTimeKey(now));
  const lateLimit = schedule
    ? timeToMinutes(schedule.startTime) + schedule.toleranceMinutes
    : timeToMinutes("08:10");

  if (!existing) {
    await db.insert(attendanceRecords).values({
      userId: user.id,
      attendanceDate: today,
      checkInAt: nowIso,
      checkInPhoto: proof.photo,
      checkInLatitude: proof.latitude,
      checkInLongitude: proof.longitude,
      checkInAccuracy: proof.accuracy,
      clientCapturedAt: proof.clientCapturedAt,
      status: currentMinutes > lateLimit ? "late" : "present",
      note: null,
      source: proof.source,
      updatedAt: nowIso
    });
    revalidatePath("/dashboard");
    revalidatePath("/absensi");
    redirect("/absensi?notice=Absen masuk tersimpan");
  }

  if (existing.checkInAt && !existing.checkOutAt) {
    await db
      .update(attendanceRecords)
      .set({
        checkOutAt: nowIso,
        checkOutPhoto: proof.photo,
        checkOutLatitude: proof.latitude,
        checkOutLongitude: proof.longitude,
        checkOutAccuracy: proof.accuracy,
        clientCapturedAt: proof.clientCapturedAt ?? existing.clientCapturedAt,
        source: proof.source === "camera_location" ? proof.source : existing.source,
        updatedAt: nowIso
      })
      .where(eq(attendanceRecords.id, existing.id));
    revalidatePath("/dashboard");
    revalidatePath("/absensi");
    redirect("/absensi?notice=Absen keluar tersimpan");
  }

  if (!existing.checkInAt) {
    await db
      .update(attendanceRecords)
      .set({
        checkInAt: nowIso,
        checkInPhoto: proof.photo,
        checkInLatitude: proof.latitude,
        checkInLongitude: proof.longitude,
        checkInAccuracy: proof.accuracy,
        clientCapturedAt: proof.clientCapturedAt,
        status: currentMinutes > lateLimit ? "late" : "present",
        source: proof.source,
        updatedAt: nowIso
      })
      .where(eq(attendanceRecords.id, existing.id));
    revalidatePath("/dashboard");
    revalidatePath("/absensi");
    redirect("/absensi?notice=Absen masuk tersimpan");
  }

  redirect("/absensi?notice=Absensi hari ini sudah lengkap");
}

const statusSchema = z.object({
  status: z.enum(["permission", "sick", "leave"]),
  note: z.string().trim().max(180).optional()
});

export async function submitStatusAction(formData: FormData) {
  const user = await requireUser();
  const today = formatDateKey();
  const parsed = statusSchema.safeParse({
    status: formData.get("status"),
    note: formData.get("note")
  });

  if (!parsed.success) {
    redirect("/absensi?notice=Status tidak valid");
  }

  const nowIso = new Date().toISOString();

  await db
    .insert(attendanceRecords)
    .values({
      userId: user.id,
      attendanceDate: today,
      status: parsed.data.status,
      note: parsed.data.note || null,
      checkInPhoto: null,
      checkOutPhoto: null,
      checkInLatitude: null,
      checkInLongitude: null,
      checkInAccuracy: null,
      checkOutLatitude: null,
      checkOutLongitude: null,
      checkOutAccuracy: null,
      clientCapturedAt: null,
      source: "web",
      updatedAt: nowIso
    })
    .onConflictDoUpdate({
      target: [attendanceRecords.userId, attendanceRecords.attendanceDate],
      set: {
        status: parsed.data.status,
        note: parsed.data.note || null,
        checkInAt: null,
        checkOutAt: null,
        checkInPhoto: null,
        checkOutPhoto: null,
        checkInLatitude: null,
        checkInLongitude: null,
        checkInAccuracy: null,
        checkOutLatitude: null,
        checkOutLongitude: null,
        checkOutAccuracy: null,
        clientCapturedAt: null,
        source: "web",
        updatedAt: nowIso
      }
    });

  revalidatePath("/dashboard");
  revalidatePath("/absensi");
  redirect("/absensi?notice=Status harian tersimpan");
}

export async function markAbsentAction(formData: FormData) {
  const user = await requireUser();
  if (user.role !== "admin" && user.role !== "petugas") redirect("/dashboard");

  const userId = Number(formData.get("userId"));
  const attendanceDate = String(formData.get("attendanceDate") ?? formatDateKey());
  const note = String(formData.get("note") ?? "").trim();
  const nowIso = new Date().toISOString();

  if (!Number.isFinite(userId) || !attendanceDate) {
    redirect("/laporan?notice=Data alfa tidak valid");
  }

  await db
    .insert(attendanceRecords)
    .values({
      userId,
      attendanceDate,
      status: "absent",
      note: note || "Ditandai petugas",
      confirmedBy: user.id,
      checkInPhoto: null,
      checkOutPhoto: null,
      checkInLatitude: null,
      checkInLongitude: null,
      checkInAccuracy: null,
      checkOutLatitude: null,
      checkOutLongitude: null,
      checkOutAccuracy: null,
      clientCapturedAt: null,
      source: "web",
      updatedAt: nowIso
    })
    .onConflictDoUpdate({
      target: [attendanceRecords.userId, attendanceRecords.attendanceDate],
      set: {
        status: "absent",
        note: note || "Ditandai petugas",
        confirmedBy: user.id,
        checkInAt: null,
        checkOutAt: null,
        checkInPhoto: null,
        checkOutPhoto: null,
        checkInLatitude: null,
        checkInLongitude: null,
        checkInAccuracy: null,
        checkOutLatitude: null,
        checkOutLongitude: null,
        checkOutAccuracy: null,
        clientCapturedAt: null,
        source: "web",
        updatedAt: nowIso
      }
    });

  revalidatePath("/laporan");
  revalidatePath("/dashboard");
  redirect("/laporan?notice=Alfa tersimpan");
}

export async function clearTodayAttendanceAction() {
  const user = await requireUser();
  const today = formatDateKey();

  await db
    .delete(attendanceRecords)
    .where(and(eq(attendanceRecords.userId, user.id), eq(attendanceRecords.attendanceDate, today)));

  revalidatePath("/absensi");
  revalidatePath("/dashboard");
  redirect("/absensi?notice=Absensi hari ini dihapus");
}
