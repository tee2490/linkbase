import { Link as LinkIcon } from "lucide-react";

type UrlPillProps = {
  handle: string;
};

// The user's short page address. Share and copy feedback are TBD in docs/ui.md.
export function UrlPill({ handle }: UrlPillProps) {
  return (
    <span className="inline-flex h-icon-btn max-w-full items-center gap-2 rounded-full bg-surface-muted px-4 text-label text-ink-app">
      <LinkIcon aria-hidden="true" size={18} strokeWidth={1.75} className="flex-none" />
      <span className="truncate">linkbase/{handle}</span>
    </span>
  );
}
