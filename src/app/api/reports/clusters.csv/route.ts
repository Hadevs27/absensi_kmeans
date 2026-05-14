import { getCurrentUser, canManageData } from "@/lib/auth";
import { getLatestClusterRun } from "@/lib/cluster-service";
import { toCsv } from "@/lib/csv";

type FeatureJson = {
  present: number;
  late: number;
  permission: number;
  sick: number;
  leave: number;
  absent: number;
  total: number;
};

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !canManageData(user.role)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const latest = await getLatestClusterRun();
  if (!latest) {
    return new Response("Belum ada data cluster", { status: 404 });
  }

  const csv = toCsv(
    latest.members.map((member) => {
      const features = JSON.parse(member.featuresJson) as FeatureJson;
      return {
        nama: member.userName,
        nip_nim: member.identifier,
        unit: member.department,
        cluster: member.clusterIndex,
        label: member.label,
        hadir: features.present,
        terlambat: features.late,
        izin: features.permission,
        sakit: features.sick,
        cuti: features.leave,
        alfa: features.absent,
        total: features.total,
        jarak: member.distance
      };
    })
  );

  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="cluster-${latest.run.periodEnd}.csv"`
    }
  });
}
