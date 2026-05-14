import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function PageHeader({
  title,
  eyebrow,
  icon: Icon,
  actions
}: {
  title: string;
  eyebrow?: string;
  icon?: LucideIcon;
  actions?: ReactNode;
}) {
  return (
    <header className="page-header">
      <div>
        {eyebrow ? <span className="eyebrow">{eyebrow}</span> : null}
        <h1>
          {Icon ? <Icon size={28} aria-hidden="true" /> : null}
          {title}
        </h1>
      </div>
      {actions ? <div className="header-actions">{actions}</div> : null}
    </header>
  );
}
