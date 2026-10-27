import type { ReactNode } from "react";

type PanelProps = {
  title: string;
  children: ReactNode;
  className?: string;
};

// White editor surface for one section of the page editor (docs/ui.md).
export function Panel({ title, children, className }: PanelProps) {
  return (
    <section className={`rounded-lg bg-surface p-6 shadow-card sm:p-10 ${className ?? ""}`}>
      <h2 className="m-0 text-title-sm text-ink-app">{title}</h2>
      {children}
    </section>
  );
}
