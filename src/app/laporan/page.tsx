import { asc } from "drizzle-orm";
import { ClipboardList, Download, Save } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { markAbsentAction } from "@/lib/actions/attendance-actions";
import { requireRole } from "@/lib/auth";
import { aggregateAttendanceFeatures, getRecentAttendance } from "@/lib/attendance-metrics";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { formatDateKey, formatDisplayDate, formatDisplayDateTime, getPeriodPreset } from "@/lib/datetime";

export default async function ReportsPage({
  searchParams
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  const user = await requireRole(["admin", "petugas"]);
  const params = await searchParams;
  const preset = getPeriodPreset(30);
  const [summary, recent, userRows] = await Promise.all([
    aggregateAttendanceFeatures(preset.start, preset.end),
    getRecentAttendance(30),
    db.select().from(users).orderBy(asc(users.name))
  ]);

  return (
    <AppShell user={user}>
      <PageHeader
        eyebrow={`${formatDisplayDate(preset.start)} - ${formatDisplayDate(preset.end)}`}
        icon={ClipboardList}
        title="Laporan"
        actions={
          <a className="secondary-button" href="/api/reports/attendance.csv">
            <Download size={18} aria-hidden="true" />
            CSV Absensi
          </a>
        }
      />

      {params.notice ? <div className="notice">{params.notice}</div> : null}

      <section className="form-card">
        <div className="section-title">
          <div>
            <h2>Tandai Alfa</h2>
            <p>Pencatatan manual oleh admin atau petugas.</p>
          </div>
        </div>
        <form action={markAbsentAction}>
          <div className="form-grid three">
            <div className="field">
              <label htmlFor="userId">Pengguna</label>
              <select id="userId" name="userId" required>
                {userRows
                  .filter((item) => item.active)
                  .map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} - {item.identifier}
                    </option>
                  ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="attendanceDate">Tanggal</label>
              <input
                id="attendanceDate"
                name="attendanceDate"
                type="date"
                defaultValue={formatDateKey()}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="note">Catatan</label>
              <input id="note" name="note" defaultValue="Tidak hadir" />
            </div>
          </div>
          <div className="button-row">
            <button className="primary-button" type="submit">
              <Save size={18} aria-hidden="true" />
              Simpan Alfa
            </button>
          </div>
        </form>
      </section>

      <section className="table-panel">
        <div className="section-title">
          <div>
            <h2>Rekap Per Pengguna</h2>
            <p>Agregasi 30 hari terakhir.</p>
          </div>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Nama</th>
                <th>Unit</th>
                <th>Hadir</th>
                <th>Terlambat</th>
                <th>Izin</th>
                <th>Sakit</th>
                <th>Cuti</th>
                <th>Alfa</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {summary.map((item) => (
                <tr key={item.userId}>
                  <td>
                    <strong>{item.name}</strong>
                    <br />
                    <small>{item.identifier}</small>
                  </td>
                  <td>{item.department}</td>
                  <td>{item.present}</td>
                  <td>{item.late}</td>
                  <td>{item.permission}</td>
                  <td>{item.sick}</td>
                  <td>{item.leave}</td>
                  <td>{item.absent}</td>
                  <td>{item.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="table-panel">
        <div className="section-title">
          <div>
            <h2>Rekap Harian</h2>
            <p>Absensi terbaru dari seluruh pengguna.</p>
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
                <th>Catatan</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((record) => (
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
                  <td>{record.note || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </AppShell>
  );
}
