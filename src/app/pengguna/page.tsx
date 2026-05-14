import { asc } from "drizzle-orm";
import { Plus, UsersRound } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { createUserAction, toggleUserAction } from "@/lib/actions/user-actions";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { schedules, users } from "@/lib/db/schema";
import { roleLabels } from "@/lib/labels";

export default async function UsersPage({
  searchParams
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  const user = await requireRole(["admin"]);
  const params = await searchParams;
  const [userRows, scheduleRows] = await Promise.all([
    db.select().from(users).orderBy(asc(users.name)),
    db.select().from(schedules).orderBy(asc(schedules.name))
  ]);

  return (
    <AppShell user={user}>
      <PageHeader eyebrow={`${userRows.length} akun`} icon={UsersRound} title="Pengguna" />

      {params.notice ? <div className="notice">{params.notice}</div> : null}

      <section className="form-card">
        <div className="section-title">
          <div>
            <h2>Tambah Pengguna</h2>
            <p>Password kosong memakai nilai awal user123.</p>
          </div>
        </div>
        <form action={createUserAction}>
          <div className="form-grid three">
            <div className="field">
              <label htmlFor="name">Nama</label>
              <input id="name" name="name" required />
            </div>
            <div className="field">
              <label htmlFor="identifier">NIP/NIM</label>
              <input id="identifier" name="identifier" required />
            </div>
            <div className="field">
              <label htmlFor="email">Email</label>
              <input id="email" name="email" type="email" required />
            </div>
            <div className="field">
              <label htmlFor="role">Role</label>
              <select id="role" name="role" required>
                <option value="pengguna">Pengguna</option>
                <option value="petugas">Petugas</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="department">Unit</label>
              <input id="department" name="department" defaultValue="Umum" required />
            </div>
            <div className="field">
              <label htmlFor="position">Jabatan</label>
              <input id="position" name="position" defaultValue="Staf" required />
            </div>
            <div className="field">
              <label htmlFor="scheduleId">Jadwal</label>
              <select id="scheduleId" name="scheduleId">
                <option value="">Tanpa jadwal</option>
                {scheduleRows.map((schedule) => (
                  <option value={schedule.id} key={schedule.id}>
                    {schedule.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="password">Password</label>
              <input id="password" name="password" type="password" minLength={6} />
            </div>
          </div>
          <div className="button-row">
            <button className="primary-button" type="submit">
              <Plus size={18} aria-hidden="true" />
              Tambah
            </button>
          </div>
        </form>
      </section>

      <section className="table-panel">
        <div className="section-title">
          <div>
            <h2>Daftar Pengguna</h2>
            <p>Role dan status akun aktif.</p>
          </div>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Nama</th>
                <th>Email</th>
                <th>Role</th>
                <th>Unit</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {userRows.map((item) => (
                <tr key={item.id}>
                  <td>
                    <strong>{item.name}</strong>
                    <br />
                    <small>{item.identifier}</small>
                  </td>
                  <td>{item.email}</td>
                  <td>{roleLabels[item.role]}</td>
                  <td>{item.department}</td>
                  <td>
                    <span className={`badge ${item.active ? "badge-green" : "badge-neutral"}`}>
                      {item.active ? "Aktif" : "Nonaktif"}
                    </span>
                  </td>
                  <td>
                    <form action={toggleUserAction}>
                      <input name="userId" type="hidden" value={item.id} />
                      <input name="active" type="hidden" value={String(item.active)} />
                      <button className="secondary-button" disabled={item.id === user.id} type="submit">
                        {item.active ? "Nonaktifkan" : "Aktifkan"}
                      </button>
                    </form>
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
