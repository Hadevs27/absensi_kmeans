import type { AttendanceStatus } from "@/lib/db/schema";
import { statusLabels, statusTone } from "@/lib/labels";

export function StatusBadge({ status }: { status: AttendanceStatus }) {
  return (
    <span className={`badge badge-${statusTone[status]}`}>
      {statusLabels[status]}
    </span>
  );
}
