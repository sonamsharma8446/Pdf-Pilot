import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="rounded-xl border border-line bg-surface px-6 py-14 text-center">
      <div className="mx-auto mb-4.5 flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-2 text-indigo">
        <Icon className="h-6.5 w-6.5" aria-hidden="true" />
      </div>
      <h3 className="font-display text-[17px] font-semibold text-ink">{title}</h3>
      <p className="mx-auto mt-1.5 max-w-xs text-sm text-ink-soft">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
