import { asc, desc } from "drizzle-orm";
import { CalendarDays, Plus } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import {
  createHolidayAction,
  createScheduleAction
} from "@/lib/actions/schedule-actions";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { holidays, schedules } from "@/lib/db/schema";
import { formatDisplayDate } from "@/lib/datetime";

const dayLabels: Record<string, string> = {
  "0": "Min",
  "1": "Sen",
  "2": "Sel",
  "3": "Rab",
  "4": "Kam",
  "5": "Jum",
  "6": "Sab"
};

function formatWorkdays(value: string) {
  return value
    .split(",")
    .map((item) => dayLabels[item.trim()] ?? item.trim())
    .join(", ");
}

export default async function SchedulePage({
  searchParams
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  const user = await requireRole(["admin"]);
  const params = await searchParams;
  const [scheduleRows, holidayRows] = await Promise.all([
    db.select().from(schedules).orderBy(asc(schedules.name)),
    db.select().from(holidays).orderBy(desc(holidays.date)).limit(12)
  ]);

  return (
    <AppShell user={user}>
      <PageHeader eyebrow="Jam kerja dan hari efektif" icon={CalendarDays} title="Jadwal" />

      {params.notice ? <div className="notice">{params.notice}</div> : null}

      <div className="content-grid">
        <section className="form-card">
          <div className="section-title">
            <div>
              <h2>Tambah Jadwal</h2>
              <p>Hari memakai angka 0-6, mulai Minggu sampai Sabtu.</p>
            </div>
          </div>
          <form action={createScheduleAction}>
            <div className="form-grid">
              <div className="field">
                <label htmlFor="name">Nama</label>
                <input id="name" name="name" placeholder="Reguler" required />
              </div>
              <div className="field">
                <label htmlFor="workdays">Hari Aktif</label>
                <input id="workdays" name="workdays" defaultValue="1,2,3,4,5" required />
              </div>
              <div className="field">
                <label htmlFor="startTime">Jam Masuk</label>
                <input id="startTime" name="startTime" type="time" defaultValue="08:00" required />
              </div>
              <div className="field">
                <label htmlFor="endTime">Jam Keluar</label>
                <input id="endTime" name="endTime" type="time" defaultValue="16:00" required />
              </div>
              <div className="field">
                <label htmlFor="toleranceMinutes">Toleransi</label>
                <input
                  id="toleranceMinutes"
                  name="toleranceMinutes"
                  type="number"
                  min="0"
                  max="120"
                  defaultValue="10"
                  required
                />
              </div>
            </div>
            <div className="button-row">
              <button className="primary-button" type="submit">
                <Plus size={18} aria-hidden="true" />
                Simpan Jadwal
              </button>
            </div>
          </form>
        </section>

        <section className="form-card">
          <div className="section-title">
            <div>
              <h2>Hari Libur</h2>
              <p>Tanggal ini ditolak untuk absen masuk/keluar.</p>
            </div>
          </div>
          <form action={createHolidayAction}>
            <div className="form-grid">
              <div className="field">
                <label htmlFor="date">Tanggal</label>
                <input id="date" name="date" type="date" required />
              </div>
              <div className="field">
                <label htmlFor="holidayName">Nama</label>
                <input id="holidayName" name="name" required />
              </div>
              <div className="field">
                <label htmlFor="type">Jenis</label>
                <input id="type" name="type" defaultValue="libur" required />
              </div>
            </div>
            <div className="button-row">
              <button className="secondary-button" type="submit">
                <Plus size={18} aria-hidden="true" />
                Simpan Libur
              </button>
            </div>
          </form>
        </section>
      </div>

      <div className="content-grid">
        <section className="table-panel">
          <div className="section-title">
            <div>
              <h2>Daftar Jadwal</h2>
              <p>Jam masuk, pulang, dan toleransi terlambat.</p>
            </div>
          </div>
          <div className="table-scroll compact-table">
            <table>
              <thead>
                <tr>
                  <th>Nama</th>
                  <th>Hari</th>
                  <th>Jam</th>
                  <th>Toleransi</th>
                </tr>
              </thead>
              <tbody>
                {scheduleRows.map((schedule) => (
                  <tr key={schedule.id}>
                    <td>{schedule.name}</td>
                    <td>{formatWorkdays(schedule.workdays)}</td>
                    <td>
                      {schedule.startTime} - {schedule.endTime}
                    </td>
                    <td>{schedule.toleranceMinutes} menit</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="table-panel">
          <div className="section-title">
            <div>
              <h2>Libur Terbaru</h2>
              <p>Tanggal yang sudah tercatat.</p>
            </div>
          </div>
          <div className="table-scroll compact-table">
            <table>
              <thead>
                <tr>
                  <th>Tanggal</th>
                  <th>Nama</th>
                  <th>Jenis</th>
                </tr>
              </thead>
              <tbody>
                {holidayRows.map((holiday) => (
                  <tr key={holiday.id}>
                    <td>{formatDisplayDate(holiday.date)}</td>
                    <td>{holiday.name}</td>
                    <td>{holiday.type}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
