import { and, asc, desc, eq, gte, lte } from "drizzle-orm";

import { db } from "@/lib/db/client";
import {
  attendanceRecords,
  attendanceStatuses,
  schedules,
  users,
  type AttendanceStatus
} from "@/lib/db/schema";
import { getPeriodPreset } from "@/lib/datetime";

export type AttendanceFeature = {
  userId: number;
  name: string;
  identifier: string;
  department: string;
  present: number;
  late: number;
  permission: number;
  sick: number;
  leave: number;
  absent: number;
  total: number;
};

export async function aggregateAttendanceFeatures(periodStart: string, periodEnd: string) {
  const [activeUsers, records] = await Promise.all([
    db
      .select({
        id: users.id,
        name: users.name,
        identifier: users.identifier,
        department: users.department
      })
      .from(users)
      .where(eq(users.active, true))
      .orderBy(asc(users.name)),
    db
      .select()
      .from(attendanceRecords)
      .where(
        and(
          gte(attendanceRecords.attendanceDate, periodStart),
          lte(attendanceRecords.attendanceDate, periodEnd)
        )
      )
  ]);

  const map = new Map<number, AttendanceFeature>();

  for (const user of activeUsers) {
    map.set(user.id, {
      userId: user.id,
      name: user.name,
      identifier: user.identifier,
      department: user.department,
      present: 0,
      late: 0,
      permission: 0,
      sick: 0,
      leave: 0,
      absent: 0,
      total: 0
    });
  }

  for (const record of records) {
    const item = map.get(record.userId);
    if (!item) continue;
    item[record.status] += 1;
    item.total += 1;
  }

  return Array.from(map.values());
}

export async function getRecentAttendance(limit = 10, userId?: number) {
  return db
    .select({
      id: attendanceRecords.id,
      attendanceDate: attendanceRecords.attendanceDate,
      checkInAt: attendanceRecords.checkInAt,
      checkOutAt: attendanceRecords.checkOutAt,
      status: attendanceRecords.status,
      note: attendanceRecords.note,
      source: attendanceRecords.source,
      checkInLatitude: attendanceRecords.checkInLatitude,
      checkInLongitude: attendanceRecords.checkInLongitude,
      checkInAccuracy: attendanceRecords.checkInAccuracy,
      checkOutLatitude: attendanceRecords.checkOutLatitude,
      checkOutLongitude: attendanceRecords.checkOutLongitude,
      checkOutAccuracy: attendanceRecords.checkOutAccuracy,
      userName: users.name,
      identifier: users.identifier
    })
    .from(attendanceRecords)
    .innerJoin(users, eq(attendanceRecords.userId, users.id))
    .where(userId ? eq(attendanceRecords.userId, userId) : undefined)
    .orderBy(desc(attendanceRecords.attendanceDate), desc(attendanceRecords.createdAt))
    .limit(limit);
}

export async function getTodayRecord(userId: number, today: string) {
  const rows = await db
    .select()
    .from(attendanceRecords)
    .where(
      and(eq(attendanceRecords.userId, userId), eq(attendanceRecords.attendanceDate, today))
    )
    .limit(1);

  return rows[0] ?? null;
}

export async function getUserSchedule(userId: number) {
  const rows = await db
    .select({ schedule: schedules })
    .from(users)
    .leftJoin(schedules, eq(users.scheduleId, schedules.id))
    .where(eq(users.id, userId))
    .limit(1);

  return rows[0]?.schedule ?? null;
}

export async function getDashboardSnapshot(userId?: number) {
  const { start, end } = getPeriodPreset(30);
  const [summary, recent] = await Promise.all([
    aggregateAttendanceFeatures(start, end),
    getRecentAttendance(8, userId)
  ]);

  const filteredSummary = userId
    ? summary.filter((item) => item.userId === userId)
    : summary;

  const totals = attendanceStatuses.reduce(
    (acc, status) => {
      acc[status] = filteredSummary.reduce((sum, item) => sum + item[status], 0);
      return acc;
    },
    {} as Record<AttendanceStatus, number>
  );

  const totalRecords = Object.values(totals).reduce((sum, value) => sum + value, 0);
  const attendanceRate =
    totalRecords === 0 ? 0 : (totals.present + totals.late) / totalRecords;

  return {
    periodStart: start,
    periodEnd: end,
    totalUsers: filteredSummary.length,
    totalRecords,
    attendanceRate,
    totals,
    recent
  };
}
