import type { AttendanceStatus, UserRole } from "@/lib/db/schema";

export const roleLabels: Record<UserRole, string> = {
  admin: "Admin",
  petugas: "Petugas",
  pengguna: "Pengguna"
};

export const statusLabels: Record<AttendanceStatus, string> = {
  present: "Hadir",
  late: "Terlambat",
  permission: "Izin",
  sick: "Sakit",
  leave: "Cuti",
  absent: "Alfa"
};

export const statusTone: Record<AttendanceStatus, string> = {
  present: "green",
  late: "amber",
  permission: "blue",
  sick: "violet",
  leave: "neutral",
  absent: "red"
};

export function percent(value: number, digits = 0) {
  return `${(value * 100).toFixed(digits)}%`;
}

export function numberFormat(value: number) {
  return new Intl.NumberFormat("id-ID").format(value);
}
