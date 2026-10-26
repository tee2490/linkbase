import type { ReactNode } from "react";
import { EllipsisVertical } from "lucide-react";

type LinkButtonProps = {
  href: string;
  showMore?: boolean;
  children: ReactNode;
};

export function LinkButton({ href, showMore = false, children }: LinkButtonProps) {
  return (
    <div className="relative">
      <a
        href={href}
        className="flex min-h-control-xl w-full items-center justify-center rounded-md bg-surface px-14 py-3 text-center text-label-lg text-ink-app transition-transform duration-150 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus motion-safe:hover:scale-[1.015]"
      >
        {children}
      </a>
      {showMore ? (
        <span className="pointer-events-none absolute top-1/2 right-3 flex size-icon-btn-sm -translate-y-1/2 items-center justify-center text-ink-app">
          <EllipsisVertical size={18} strokeWidth={1.75} />
        </span>
      ) : null}
    </div>
  );
}
