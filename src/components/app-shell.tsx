import {
  BarChart3,
  CalendarDays,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  ScanLine,
  Settings2,
  UsersRound
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { logoutAction } from "@/lib/actions/auth-actions";
import { canManageData, type CurrentUser } from "@/lib/auth";
import { roleLabels } from "@/lib/labels";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, access: "all" },
  { href: "/absensi", label: "Absensi", icon: ScanLine, access: "all" },
  { href: "/pengguna", label: "Pengguna", icon: UsersRound, access: "admin" },
  { href: "/jadwal", label: "Jadwal", icon: CalendarDays, access: "admin" },
  { href: "/analisis", label: "Analisis", icon: BarChart3, access: "staff" },
  { href: "/laporan", label: "Laporan", icon: ClipboardList, access: "staff" }
] as const;

export function AppShell({
  user,
  children
}: {
  user: CurrentUser;
  children: ReactNode;
}) {
  const canManage = canManageData(user.role);

  const visibleItems = navItems.filter((item) => {
    if (item.access === "all") return true;
    if (item.access === "admin") return user.role === "admin";
    return canManage;
  });

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link className="brand" href="/dashboard">
          <span className="brand-mark">AK</span>
          <span>
            <strong>Absensi</strong>
            <small>K-Means</small>
          </span>
        </Link>

        <nav className="nav-list" aria-label="Navigasi utama">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link className="nav-item" href={item.href} key={item.href}>
                <Icon size={18} aria-hidden="true" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="user-chip">
            <span className="avatar">{user.name.slice(0, 2).toUpperCase()}</span>
            <span>
              <strong>{user.name}</strong>
              <small>{roleLabels[user.role]}</small>
            </span>
          </div>
          <form action={logoutAction}>
            <button className="icon-text-button muted" type="submit">
              <LogOut size={16} aria-hidden="true" />
              Keluar
            </button>
          </form>
        </div>
      </aside>

      <main className="main-area">
        <div className="top-strip">
          <div>
            <strong>{user.department}</strong>
            <span>{user.identifier}</span>
          </div>
          <Settings2 size={18} aria-hidden="true" />
        </div>
        {children}
      </main>
    </div>
  );
}
