import { BarChart3, Play, Table2 } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { runClusterAction } from "@/lib/actions/cluster-actions";
import { requireRole } from "@/lib/auth";
import { getLatestClusterRun } from "@/lib/cluster-service";
import { formatDisplayDate, getPeriodPreset } from "@/lib/datetime";
import { numberFormat } from "@/lib/labels";

type FeatureJson = {
  present: number;
  late: number;
  permission: number;
  sick: number;
  leave: number;
  absent: number;
  total: number;
};

export default async function AnalysisPage({
  searchParams
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  const user = await requireRole(["admin", "petugas"]);
  const params = await searchParams;
  const latest = await getLatestClusterRun();
  const preset = getPeriodPreset(30);

  return (
    <AppShell user={user}>
      <PageHeader
        eyebrow="K-Means Clustering"
        icon={BarChart3}
        title="Analisis"
        actions={
          latest ? (
            <a className="secondary-button" href="/api/reports/clusters.csv">
              <Table2 size={18} aria-hidden="true" />
              CSV Cluster
            </a>
          ) : null
        }
      />

      {params.notice ? <div className="notice">{params.notice}</div> : null}

      <section className="form-card">
        <div className="section-title">
          <div>
            <h2>Jalankan K-Means</h2>
            <p>Fitur: hadir, terlambat, izin, sakit, cuti, dan alfa per pengguna.</p>
          </div>
        </div>
        <form action={runClusterAction}>
          <div className="form-grid three">
            <div className="field">
              <label htmlFor="periodStart">Mulai</label>
              <input id="periodStart" name="periodStart" type="date" defaultValue={preset.start} />
            </div>
            <div className="field">
              <label htmlFor="periodEnd">Selesai</label>
              <input id="periodEnd" name="periodEnd" type="date" defaultValue={preset.end} />
            </div>
            <div className="field">
              <label htmlFor="k">Jumlah Cluster</label>
              <select id="k" name="k" defaultValue="3">
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5">5</option>
              </select>
            </div>
          </div>
          <div className="button-row">
            <button className="primary-button" type="submit">
              <Play size={18} aria-hidden="true" />
              Jalankan
            </button>
          </div>
        </form>
      </section>

      {latest ? (
        <>
          <div className="stats-grid">
            <div className="stat-card tone-blue">
              <div className="stat-icon">
                <BarChart3 size={20} aria-hidden="true" />
              </div>
              <div>
                <span>Cluster</span>
                <strong>{latest.run.k}</strong>
                <small>
                  {formatDisplayDate(latest.run.periodStart)} -{" "}
                  {formatDisplayDate(latest.run.periodEnd)}
                </small>
              </div>
            </div>
            <div className="stat-card tone-green">
              <div className="stat-icon">
                <BarChart3 size={20} aria-hidden="true" />
              </div>
              <div>
                <span>Silhouette</span>
                <strong>{latest.run.silhouette.toFixed(2)}</strong>
                <small>Metrik pemisahan cluster</small>
              </div>
            </div>
            <div className="stat-card tone-amber">
              <div className="stat-icon">
                <BarChart3 size={20} aria-hidden="true" />
              </div>
              <div>
                <span>Anggota</span>
                <strong>{numberFormat(latest.run.totalMembers)}</strong>
                <small>Pengguna teranalisis</small>
              </div>
            </div>
          </div>

          <section className="panel">
            <div className="section-title">
              <div>
                <h2>Ringkasan Cluster</h2>
                <p>Jumlah anggota per label hasil analisis.</p>
              </div>
            </div>
            <div className="cluster-grid">
              {latest.summary.map((item) => (
                <div className="cluster-card" key={item.clusterIndex}>
                  <strong>{item.label}</strong>
                  <span>{item.members} pengguna</span>
                </div>
              ))}
            </div>
          </section>

          <section className="table-panel">
            <div className="section-title">
              <div>
                <h2>Hasil Cluster</h2>
                <p>Data agregat yang dipakai model.</p>
              </div>
            </div>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Pengguna</th>
                    <th>Cluster</th>
                    <th>Hadir</th>
                    <th>Terlambat</th>
                    <th>Izin</th>
                    <th>Sakit</th>
                    <th>Cuti</th>
                    <th>Alfa</th>
                    <th>Jarak</th>
                  </tr>
                </thead>
                <tbody>
                  {latest.members.map((member) => {
                    const features = JSON.parse(member.featuresJson) as FeatureJson;
                    return (
                      <tr key={member.id}>
                        <td>
                          <strong>{member.userName}</strong>
                          <br />
                          <small>{member.identifier}</small>
                        </td>
                        <td>
                          <span className="badge badge-blue">{member.label}</span>
                        </td>
                        <td>{features.present}</td>
                        <td>{features.late}</td>
                        <td>{features.permission}</td>
                        <td>{features.sick}</td>
                        <td>{features.leave}</td>
                        <td>{features.absent}</td>
                        <td>{member.distance.toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : (
        <div className="empty-state">Belum ada hasil clustering.</div>
      )}
    </AppShell>
  );
}
