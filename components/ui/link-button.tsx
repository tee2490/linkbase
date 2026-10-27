import type { ReactNode } from "react";
import { EllipsisVertical } from "lucide-react";

import { ExternalLink } from "@/components/ui/external-link";

type LinkButtonProps = {
  href: string;
  showMore?: boolean;
  // A user-supplied URL: opens in a new tab through ExternalLink (docs/security.md).
  external?: boolean;
  children: ReactNode;
};

const linkClassName =
  "flex min-h-control-xl w-full items-center justify-center rounded-md bg-surface px-14 py-3 text-center text-label-lg text-ink-app transition-transform duration-150 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus motion-safe:hover:scale-[1.015]";

export function LinkButton({ href, showMore = false, external = false, children }: LinkButtonProps) {
  return (
    <div className="relative">
      {external ? (
        <ExternalLink href={href} className={linkClassName}>
          {children}
          <span className="sr-only"> (opens in a new tab)</span>
        </ExternalLink>
      ) : (
        <a href={href} className={linkClassName}>
          {children}
        </a>
      )}
      {showMore ? (
        <span className="pointer-events-none absolute top-1/2 right-3 flex size-icon-btn-sm -translate-y-1/2 items-center justify-center text-ink-app">
          <EllipsisVertical size={18} strokeWidth={1.75} />
        </span>
      ) : null}
    </div>
  );
}
