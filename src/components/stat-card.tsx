import type { LucideIcon } from "lucide-react";

export function StatCard({
  label,
  value,
  detail,
  icon: Icon,
  tone = "default"
}: {
  label: string;
  value: string | number;
  detail?: string;
  icon?: LucideIcon;
  tone?: "default" | "green" | "amber" | "red" | "blue";
}) {
  return (
    <section className={`stat-card tone-${tone}`}>
      <div className="stat-icon">{Icon ? <Icon size={20} aria-hidden="true" /> : null}</div>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        {detail ? <small>{detail}</small> : null}
      </div>
    </section>
  );
}
