"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { X } from "lucide-react";

import { IconButton } from "./icon-button";

type DialogProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  // alertdialog for confirmations, so screen readers announce it as one.
  role?: "dialog" | "alertdialog";
};

// A native modal <dialog>: showModal() gives the focus trap, inert background and
// Escape-to-close, so none of that is hand-rolled here.
export function Dialog({ open, onClose, title, children, role = "dialog" }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      role={role}
      aria-labelledby={titleId}
      // Fires for Escape and dialog.close(); keeps `open` in sync with the browser.
      onClose={onClose}
      className="m-auto w-[min(440px,calc(100vw-32px))] rounded-xl border border-border-subtle bg-surface-card p-5 text-fg shadow-pop backdrop:bg-ink/40"
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 id={titleId} className="m-0 text-[17px] leading-none font-semibold">
          {title}
        </h2>
        <IconButton icon={X} label="Close" variant="plain" size={32} onClick={onClose} />
      </div>
      {children}
    </dialog>
  );
}
