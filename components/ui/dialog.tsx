"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";

type DialogProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: ReactNode;
  children: ReactNode;
};

// Modal on the native <dialog>: it traps focus, closes on Esc and returns focus to the
// element that opened it, so none of that is hand-rolled here (docs/ui.md).
export function Dialog({ open, onClose, title, description, children }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      // Esc fires "cancel" then "close"; both paths end in onClose so the parent's state stays in sync.
      onClose={onClose}
      onClick={(event) => {
        // A click on the dialog element itself (not its content) is a click on the backdrop.
        if (event.target === event.currentTarget) onClose();
      }}
      className="m-auto w-[min(480px,calc(100%-32px))] rounded-lg bg-surface p-0 text-ink-app shadow-phone backdrop:bg-scrim"
    >
      <div className="flex flex-col gap-6 p-8 max-sm:p-6">
        <div className="flex flex-col gap-2">
          <h2 id={titleId} className="m-0 text-title-sm text-ink-app">
            {title}
          </h2>
          {description ? (
            <p id={descriptionId} className="m-0 text-body-md text-muted-app">
              {description}
            </p>
          ) : null}
        </div>
        {children}
      </div>
    </dialog>
  );
}
