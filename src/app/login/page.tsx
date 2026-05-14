import { KeyRound, LogIn } from "lucide-react";
import { redirect } from "next/navigation";

import { loginAction } from "@/lib/actions/auth-actions";
import { getCurrentUser } from "@/lib/auth";

export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  const params = await searchParams;

  return (
    <main className="login-page">
      <section className="login-art">
        <div className="login-art-inner">
          <span className="eyebrow">Sistem Informasi Absensi</span>
          <h1>Absensi digital dengan analisis pola kehadiran</h1>
          <p>
            Data hadir, terlambat, izin, sakit, cuti, dan alfa dikelola dalam satu
            dashboard lalu dianalisis memakai K-Means.
          </p>
          <div className="demo-grid">
            <div className="demo-tile">
              <strong>Admin</strong>
              <span>admin@absensi.test / admin123</span>
            </div>
            <div className="demo-tile">
              <strong>Petugas</strong>
              <span>petugas@absensi.test / petugas123</span>
            </div>
            <div className="demo-tile">
              <strong>Pengguna</strong>
              <span>budi@absensi.test / user123</span>
            </div>
          </div>
        </div>
      </section>

      <section className="login-panel">
        <form className="login-card" action={loginAction}>
          <KeyRound size={34} aria-hidden="true" />
          <h2>Masuk</h2>
          <p>Gunakan akun yang tersedia di data awal.</p>

          {params.error ? <div className="notice">{params.error}</div> : null}

          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="text"
              inputMode="email"
              autoComplete="email"
              required
            />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </div>
          <div className="button-row">
            <button className="primary-button" type="submit">
              <LogIn size={18} aria-hidden="true" />
              Masuk
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
