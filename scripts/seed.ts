import "dotenv/config";

import { hash } from "bcryptjs";

import { aggregateAttendanceFeatures } from "../src/lib/attendance-metrics";
import { createClusterRun } from "../src/lib/cluster-service";
import { client, db } from "../src/lib/db/client";
import {
  activityLogs,
  attendanceRecords,
  clusterMembers,
  clusterRuns,
  holidays,
  schedules,
  sessions,
  users
} from "../src/lib/db/schema";
import { addDays, dayOfWeekFromDateKey, formatDateKey, getPeriodPreset } from "../src/lib/datetime";

function isoAt(dateKey: string, time: string) {
  return new Date(`${dateKey}T${time}:00+07:00`).toISOString();
}

function seeded(seed: number) {
  let value = seed;
  return () => {
    value = (value * 9301 + 49297) % 233280;
    return value / 233280;
  };
}

function pickStatus(profile: string, random: number) {
  if (profile === "rajin") {
    if (random < 0.86) return "present";
    if (random < 0.94) return "late";
    if (random < 0.98) return "permission";
    return "sick";
  }
  if (profile === "terlambat") {
    if (random < 0.48) return "present";
    if (random < 0.78) return "late";
    if (random < 0.88) return "permission";
    if (random < 0.94) return "sick";
    return "absent";
  }
  if (profile === "izin") {
    if (random < 0.54) return "present";
    if (random < 0.64) return "late";
    if (random < 0.82) return "permission";
    if (random < 0.94) return "sick";
    return "leave";
  }
  if (random < 0.36) return "present";
  if (random < 0.48) return "late";
  if (random < 0.58) return "permission";
  if (random < 0.68) return "sick";
  return "absent";
}

async function main() {
  await db.delete(clusterMembers);
  await db.delete(clusterRuns);
  await db.delete(attendanceRecords);
  await db.delete(activityLogs);
  await db.delete(sessions);
  await db.delete(users);
  await db.delete(holidays);
  await db.delete(schedules);

  const regular = await db
    .insert(schedules)
    .values({
      name: "Reguler",
      workdays: "1,2,3,4,5",
      startTime: "08:00",
      endTime: "16:00",
      toleranceMinutes: 10
    })
    .returning({ id: schedules.id });

  const teaching = await db
    .insert(schedules)
    .values({
      name: "Akademik",
      workdays: "1,2,3,4,5,6",
      startTime: "07:30",
      endTime: "15:30",
      toleranceMinutes: 15
    })
    .returning({ id: schedules.id });

  const adminPassword = await hash("admin123", 10);
  const petugasPassword = await hash("petugas123", 10);
  const userPassword = await hash("user123", 10);

  const insertedUsers = await db
    .insert(users)
    .values([
      {
        name: "Admin Sistem",
        identifier: "ADM-001",
        email: "admin@absensi.test",
        passwordHash: adminPassword,
        role: "admin",
        department: "Tata Usaha",
        position: "Administrator",
        scheduleId: regular[0].id
      },
      {
        name: "Petugas Absensi",
        identifier: "PTG-001",
        email: "petugas@absensi.test",
        passwordHash: petugasPassword,
        role: "petugas",
        department: "Tata Usaha",
        position: "Petugas",
        scheduleId: regular[0].id
      },
      {
        name: "Budi Santoso",
        identifier: "PGW-001",
        email: "budi@absensi.test",
        passwordHash: userPassword,
        role: "pengguna",
        department: "Akademik",
        position: "Guru",
        scheduleId: teaching[0].id
      },
      {
        name: "Siti Rahma",
        identifier: "PGW-002",
        email: "siti@absensi.test",
        passwordHash: userPassword,
        role: "pengguna",
        department: "Akademik",
        position: "Guru",
        scheduleId: teaching[0].id
      },
      {
        name: "Raka Pratama",
        identifier: "PGW-003",
        email: "raka@absensi.test",
        passwordHash: userPassword,
        role: "pengguna",
        department: "Keuangan",
        position: "Staf",
        scheduleId: regular[0].id
      },
      {
        name: "Maya Lestari",
        identifier: "PGW-004",
        email: "maya@absensi.test",
        passwordHash: userPassword,
        role: "pengguna",
        department: "Keuangan",
        position: "Staf",
        scheduleId: regular[0].id
      },
      {
        name: "Dimas Putra",
        identifier: "PGW-005",
        email: "dimas@absensi.test",
        passwordHash: userPassword,
        role: "pengguna",
        department: "Operasional",
        position: "Staf",
        scheduleId: regular[0].id
      },
      {
        name: "Nadia Kirana",
        identifier: "PGW-006",
        email: "nadia@absensi.test",
        passwordHash: userPassword,
        role: "pengguna",
        department: "Operasional",
        position: "Staf",
        scheduleId: regular[0].id
      },
      {
        name: "Fajar Nugroho",
        identifier: "PGW-007",
        email: "fajar@absensi.test",
        passwordHash: userPassword,
        role: "pengguna",
        department: "Akademik",
        position: "Guru",
        scheduleId: teaching[0].id
      },
      {
        name: "Ayu Wulandari",
        identifier: "PGW-008",
        email: "ayu@absensi.test",
        passwordHash: userPassword,
        role: "pengguna",
        department: "Perpustakaan",
        position: "Staf",
        scheduleId: regular[0].id
      }
    ])
    .returning({ id: users.id, email: users.email });

  const today = formatDateKey();
  const holidayDates = [addDays(today, -22), addDays(today, -9)];

  await db.insert(holidays).values([
    { date: holidayDates[0], name: "Cuti Bersama Institusi", type: "cuti bersama" },
    { date: holidayDates[1], name: "Kegiatan Internal", type: "libur" }
  ]);

  const profileByEmail = new Map([
    ["admin@absensi.test", "rajin"],
    ["petugas@absensi.test", "rajin"],
    ["budi@absensi.test", "rajin"],
    ["siti@absensi.test", "rajin"],
    ["raka@absensi.test", "terlambat"],
    ["maya@absensi.test", "izin"],
    ["dimas@absensi.test", "rawan"],
    ["nadia@absensi.test", "terlambat"],
    ["fajar@absensi.test", "rawan"],
    ["ayu@absensi.test", "izin"]
  ]);

  const random = seeded(42);
  const records: Array<typeof attendanceRecords.$inferInsert> = [];

  for (let offset = 44; offset >= 0; offset -= 1) {
    const dateKey = addDays(today, -offset);
    const day = dayOfWeekFromDateKey(dateKey);
    if (day === 0 || holidayDates.includes(dateKey)) continue;

    for (const person of insertedUsers) {
      const profile = profileByEmail.get(person.email) ?? "rajin";
      const status = pickStatus(profile, random());
      const isAcademic = person.email === "budi@absensi.test" || person.email === "siti@absensi.test" || person.email === "fajar@absensi.test";
      const baseIn = isAcademic ? "07:" : "08:";
      const baseOut = isAcademic ? "15:" : "16:";
      const minute = String(Math.floor(random() * 10)).padStart(2, "0");
      const lateMinute = String(18 + Math.floor(random() * 35)).padStart(2, "0");

      records.push({
        userId: person.id,
        attendanceDate: dateKey,
        status,
        checkInAt:
          status === "present"
            ? isoAt(dateKey, `${baseIn}${minute}`)
            : status === "late"
              ? isoAt(dateKey, `${baseIn}${lateMinute}`)
              : null,
        checkOutAt:
          status === "present" || status === "late"
            ? isoAt(dateKey, `${baseOut}${String(5 + Math.floor(random() * 35)).padStart(2, "0")}`)
            : null,
        note:
          status === "permission"
            ? "Izin pribadi"
            : status === "sick"
              ? "Sakit"
              : status === "leave"
                ? "Cuti"
                : status === "absent"
                  ? "Tidak hadir"
                  : null,
        source: "seed"
      });
    }
  }

  if (records.length > 0) {
    await db.insert(attendanceRecords).values(records);
  }

  const period = getPeriodPreset(30);
  await aggregateAttendanceFeatures(period.start, period.end);
  await createClusterRun({
    periodStart: period.start,
    periodEnd: period.end,
    k: 3,
    createdBy: insertedUsers[0].id
  });

  console.log(`Seed selesai: ${insertedUsers.length} pengguna, ${records.length} absensi.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => {
    client.close();
  });
