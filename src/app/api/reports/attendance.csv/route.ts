import { getCurrentUser, canManageData } from "@/lib/auth";
import { aggregateAttendanceFeatures } from "@/lib/attendance-metrics";
import { toCsv } from "@/lib/csv";
import { getPeriodPreset } from "@/lib/datetime";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !canManageData(user.role)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const preset = getPeriodPreset(30);
  const summary = await aggregateAttendanceFeatures(preset.start, preset.end);
  const csv = toCsv(
    summary.map((item) => ({
      user_id: item.userId,
      nama: item.name,
      nip_nim: item.identifier,
      unit: item.department,
      hadir: item.present,
      terlambat: item.late,
      izin: item.permission,
      sakit: item.sick,
      cuti: item.leave,
      alfa: item.absent,
      total: item.total
    }))
  );

  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="rekap-absensi-${preset.end}.csv"`
    }
  });
}
