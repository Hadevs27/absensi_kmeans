import { Activity, BarChart3, CalendarCheck2, UsersRound } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { StatusBadge } from "@/components/status-badge";
import { requireUser, canManageData } from "@/lib/auth";
import { getDashboardSnapshot } from "@/lib/attendance-metrics";
import { getLatestClusterRun } from "@/lib/cluster-service";
import { formatDisplayDate, formatDisplayDateTime } from "@/lib/datetime";
import { numberFormat, percent, statusLabels } from "@/lib/labels";

export default async function DashboardPage() {
  const user = await requireUser();
  const canManage = canManageData(user.role);
  const [snapshot, latestCluster] = await Promise.all([
    getDashboardSnapshot(canManage ? undefined : user.id),
    canManage ? getLatestClusterRun() : Promise.resolve(null)
  ]);

  const total = Math.max(1, snapshot.totalRecords);
  const keyRates = [
    { label: statusLabels.present, value: snapshot.totals.present / total },
    { label: statusLabels.late, value: snapshot.totals.late / total },
    { label: statusLabels.permission, value: snapshot.totals.permission / total },
    { label: statusLabels.sick, value: snapshot.totals.sick / total },
    { label: statusLabels.absent, value: snapshot.totals.absent / total }
  ];

  return (
    <AppShell user={user}>
      <PageHeader
        eyebrow={`${formatDisplayDate(snapshot.periodStart)} - ${formatDisplayDate(snapshot.periodEnd)}`}
        icon={Activity}
        title="Dashboard"
      />

      <div className="stats-grid">
        <StatCard
          detail={canManage ? "Pengguna aktif" : "Data pribadi"}
          icon={UsersRound}
          label="Subjek"
          value={numberFormat(snapshot.totalUsers)}
        />
        <StatCard
          detail="Rekaman periode"
          icon={CalendarCheck2}
          label="Absensi"
          value={numberFormat(snapshot.totalRecords)}
          tone="blue"
        />
        <StatCard
          detail="Hadir + terlambat"
          icon={BarChart3}
          label="Tingkat Hadir"
          value={percent(snapshot.attendanceRate)}
          tone="green"
        />
        <StatCard
          detail="Alfa tercatat"
          icon={Activity}
          label="Risiko"
          value={numberFormat(snapshot.totals.absent)}
          tone={snapshot.totals.absent > 0 ? "amber" : "green"}
        />
      </div>

      <div className="content-grid">
        <section className="panel">
          <div className="section-title">
            <div>
              <h2>Komposisi Absensi</h2>
              <p>{numberFormat(snapshot.totalRecords)} data dalam periode berjalan.</p>
            </div>
          </div>
          <div className="metric-bars">
            {keyRates.map((item) => (
              <div className="metric-row" key={item.label}>
                <span>{item.label}</span>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: percent(item.value) }} />
                </div>
                <strong>{percent(item.value)}</strong>
              </div>
            ))}
          </div>
        </section>

        <section className="panel">
          <div className="section-title">
            <div>
              <h2>Cluster Terbaru</h2>
              <p>
                {latestCluster
                  ? `Silhouette ${latestCluster.run.silhouette.toFixed(2)}`
                  : "Belum ada hasil analisis."}
              </p>
            </div>
          </div>
          {latestCluster ? (
            <div className="cluster-grid">
              {latestCluster.summary.map((item) => (
                <div className="cluster-card" key={item.clusterIndex}>
                  <strong>{item.label}</strong>
                  <span>{item.members} pengguna</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">Jalankan K-Means dari halaman Analisis.</div>
          )}
        </section>
      </div>

      <section className="table-panel">
        <div className="section-title">
          <div>
            <h2>Aktivitas Terbaru</h2>
            <p>Rekaman absensi yang terakhir masuk.</p>
          </div>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Nama</th>
                <th>Tanggal</th>
                <th>Masuk</th>
                <th>Keluar</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {snapshot.recent.map((record) => (
                <tr key={record.id}>
                  <td>
                    <strong>{record.userName}</strong>
                    <br />
                    <small>{record.identifier}</small>
                  </td>
                  <td>{formatDisplayDate(record.attendanceDate)}</td>
                  <td>{formatDisplayDateTime(record.checkInAt)}</td>
                  <td>{formatDisplayDateTime(record.checkOutAt)}</td>
                  <td>
                    <StatusBadge status={record.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </AppShell>
  );
}
