"use client";

import { Share } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { IconButton } from "@/components/ui/icon-button";

const COPIED_MS = 1800;

export function ShareButton() {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
    } catch {
      // Clipboard can be blocked (permissions, insecure origin). Nothing to confirm then.
      return;
    }
    setCopied(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), COPIED_MS);
  }

  return (
    <div className="flex items-center gap-2">
      <span role="status" className="text-[13px] leading-[18px] font-semibold">
        {copied ? (
          <span className="rounded-full bg-ink-app px-3.5 py-2 text-ink-inverse">Link copied</span>
        ) : null}
      </span>
      <IconButton
        label="Share this page"
        icon={<Share aria-hidden="true" size={20} strokeWidth={1.75} />}
        variant="surface"
        size="md"
        onClick={copyLink}
      />
    </div>
  );
}
