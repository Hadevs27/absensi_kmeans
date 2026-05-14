import { Camera, Clock3, RotateCcw, Save, Send } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { VerifiedAttendanceForm } from "@/components/verified-attendance-form";
import {
  clearTodayAttendanceAction,
  clockAttendanceAction,
  submitStatusAction
} from "@/lib/actions/attendance-actions";
import { requireUser } from "@/lib/auth";
import { getRecentAttendance, getTodayRecord, getUserSchedule } from "@/lib/attendance-metrics";
import { formatDateKey, formatDisplayDate, formatDisplayDateTime, formatTimeKey } from "@/lib/datetime";
import { statusLabels } from "@/lib/labels";

function formatCoordinate(latitude?: number | null, longitude?: number | null) {
  if (latitude == null || longitude == null) return "-";
  return `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
}

function mapHref(latitude?: number | null, longitude?: number | null) {
  if (latitude == null || longitude == null) return "";
  return `https://www.google.com/maps?q=${latitude},${longitude}`;
}

export default async function AttendancePage({
  searchParams
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  const user = await requireUser();
  const today = formatDateKey();
  const params = await searchParams;
  const [todayRecord, schedule, history] = await Promise.all([
    getTodayRecord(user.id, today),
    getUserSchedule(user.id),
    getRecentAttendance(12, user.id)
  ]);

  const buttonLabel = !todayRecord?.checkInAt
    ? "Absen Masuk"
    : todayRecord.checkOutAt
      ? "Absensi Lengkap"
      : "Absen Keluar";
  const verifiedButtonLabel = !todayRecord?.checkInAt
    ? "Kirim Masuk Terverifikasi"
    : todayRecord.checkOutAt
      ? "Absensi Lengkap"
      : "Kirim Keluar Terverifikasi";

  return (
    <AppShell user={user}>
      <PageHeader eyebrow={formatDisplayDate(today)} icon={Clock3} title="Absensi" />

      {params.notice ? <div className="notice">{params.notice}</div> : null}

      <div className="content-grid">
        <section className="panel clock-panel">
          <div className="clock-face">
            <div className="clock-icon">
              <Clock3 size={34} aria-hidden="true" />
            </div>
            <div>
              <strong>{formatTimeKey()}</strong>
              <span>
                {schedule
                  ? `${schedule.name}: ${schedule.startTime} - ${schedule.endTime}`
                  : "Jadwal standar"}
              </span>
            </div>
          </div>

          {todayRecord ? (
            <div className="table-scroll compact-table">
              <table>
                <tbody>
                  <tr>
                    <th>Status</th>
                    <td>
                      <StatusBadge status={todayRecord.status} />
                    </td>
                  </tr>
                  <tr>
                    <th>Masuk</th>
                    <td>{formatDisplayDateTime(todayRecord.checkInAt)}</td>
                  </tr>
                  <tr>
                    <th>Keluar</th>
                    <td>{formatDisplayDateTime(todayRecord.checkOutAt)}</td>
                  </tr>
                  <tr>
                    <th>Catatan</th>
                    <td>{todayRecord.note || "-"}</td>
                  </tr>
                  <tr>
                    <th>Metode</th>
                    <td>
                      <span className={`badge ${todayRecord.source === "camera_location" ? "badge-blue" : "badge-neutral"}`}>
                        {todayRecord.source === "camera_location" ? "Kamera & Lokasi" : "Web"}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <th>Lokasi Masuk</th>
                    <td>
                      {todayRecord.checkInLatitude != null && todayRecord.checkInLongitude != null ? (
                        <a
                          className="map-link"
                          href={mapHref(todayRecord.checkInLatitude, todayRecord.checkInLongitude)}
                          rel="noreferrer"
                          target="_blank"
                        >
                          {formatCoordinate(todayRecord.checkInLatitude, todayRecord.checkInLongitude)}
                        </a>
                      ) : (
                        "-"
                      )}
                    </td>
                  </tr>
                  <tr>
                    <th>Lokasi Keluar</th>
                    <td>
                      {todayRecord.checkOutLatitude != null && todayRecord.checkOutLongitude != null ? (
                        <a
                          className="map-link"
                          href={mapHref(todayRecord.checkOutLatitude, todayRecord.checkOutLongitude)}
                          rel="noreferrer"
                          target="_blank"
                        >
                          {formatCoordinate(todayRecord.checkOutLatitude, todayRecord.checkOutLongitude)}
                        </a>
                      ) : (
                        "-"
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">Belum ada absensi hari ini.</div>
          )}

          <div className="button-row">
            <form action={clockAttendanceAction}>
              <button className="primary-button" disabled={Boolean(todayRecord?.checkOutAt)} type="submit">
                <Save size={18} aria-hidden="true" />
                {buttonLabel}
              </button>
            </form>
            {todayRecord ? (
              <form action={clearTodayAttendanceAction}>
                <button className="secondary-button" type="submit">
                  <RotateCcw size={18} aria-hidden="true" />
                  Reset Hari Ini
                </button>
              </form>
            ) : null}
          </div>

          <div className="verification-section">
            <div className="section-title">
              <div>
                <h2>
                  <Camera size={20} aria-hidden="true" />
                  Absen Kamera & Lokasi
                </h2>
                <p>Gunakan foto dan titik GPS sebagai bukti masuk atau keluar.</p>
              </div>
            </div>
            <VerifiedAttendanceForm
              action={clockAttendanceAction}
              disabled={Boolean(todayRecord?.checkOutAt)}
              submitLabel={verifiedButtonLabel}
            />
          </div>
        </section>

        <section className="form-card">
          <div className="section-title">
            <div>
              <h2>Status Harian</h2>
              <p>Izin, sakit, atau cuti tercatat tanpa jam masuk.</p>
            </div>
          </div>
          <form action={submitStatusAction}>
            <div className="form-grid">
              <div className="field">
                <label htmlFor="status">Status</label>
                <select id="status" name="status" required>
                  <option value="permission">{statusLabels.permission}</option>
                  <option value="sick">{statusLabels.sick}</option>
                  <option value="leave">{statusLabels.leave}</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="note">Catatan</label>
                <input id="note" name="note" maxLength={180} placeholder="Opsional" />
              </div>
            </div>
            <div className="button-row">
              <button className="secondary-button" type="submit">
                <Send size={18} aria-hidden="true" />
                Simpan Status
              </button>
            </div>
          </form>
        </section>
      </div>

      <section className="table-panel">
        <div className="section-title">
          <div>
            <h2>Riwayat Saya</h2>
            <p>Daftar absensi terbaru.</p>
          </div>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>Masuk</th>
                <th>Keluar</th>
                <th>Status</th>
                <th>Bukti</th>
                <th>Catatan</th>
              </tr>
            </thead>
            <tbody>
              {history.map((record) => (
                <tr key={record.id}>
                  <td>{formatDisplayDate(record.attendanceDate)}</td>
                  <td>{formatDisplayDateTime(record.checkInAt)}</td>
                  <td>{formatDisplayDateTime(record.checkOutAt)}</td>
                  <td>
                    <StatusBadge status={record.status} />
                  </td>
                  <td>
                    <span className={`badge ${record.source === "camera_location" ? "badge-blue" : "badge-neutral"}`}>
                      {record.source === "camera_location" ? "Terverifikasi" : "Web"}
                    </span>
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
