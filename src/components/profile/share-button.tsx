"use client";

import { useState } from "react";
import { Share } from "lucide-react";

import { IconButton } from "@/components/ui/icon-button";

const COPIED_RESET_MS = 2000;

type ShareButtonProps = {
  handle: string;
};

// Uses the native share sheet where there is one, otherwise copies the URL.
export function ShareButton({ handle }: ShareButtonProps) {
  const [status, setStatus] = useState("");

  async function share() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: `@${handle} on Linkbase`, url });
      } catch {
        // The user closed the share sheet; nothing to report.
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setStatus("Link copied");
    } catch {
      setStatus("Couldn't copy the link");
    }
    setTimeout(() => setStatus(""), COPIED_RESET_MS);
  }

  return (
    <div className="relative">
      <IconButton
        icon={Share}
        label={`Share @${handle}'s Linkbase`}
        variant="float"
        shape="square"
        size={44}
        onClick={share}
      />
      <p
        aria-live="polite"
        className="absolute top-[calc(100%+6px)] right-0 m-0 whitespace-nowrap text-13 font-medium text-fg-secondary"
      >
        {status}
      </p>
    </div>
  );
}
