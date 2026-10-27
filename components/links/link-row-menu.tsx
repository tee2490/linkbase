"use client";

import { EllipsisVertical, Pencil, Trash2 } from "lucide-react";
import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";

import { IconButton } from "@/components/ui/icon-button";

type LinkRowMenuProps = {
  title: string;
  onEdit: () => void;
  onDelete: () => void;
};

const itemClassName =
  "flex w-full items-center gap-3 rounded-sm px-3 py-2.5 text-left text-label text-ink-app outline-none hover:bg-surface-muted focus-visible:bg-surface-muted";

// Same keyboard pattern as components/auth/user-menu.tsx.
export function LinkRowMenu({ title, onEdit, onDelete }: LinkRowMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    menuRef.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();

    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  function choose(action: () => void) {
    setOpen(false);
    action();
  }

  function handleMenuKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const items = Array.from(menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? []);
    const index = items.indexOf(document.activeElement as HTMLElement);

    switch (event.key) {
      case "Escape":
        event.preventDefault();
        setOpen(false);
        triggerRef.current?.focus();
        break;
      case "ArrowDown":
        event.preventDefault();
        items[(index + 1) % items.length]?.focus();
        break;
      case "ArrowUp":
        event.preventDefault();
        items[(index - 1 + items.length) % items.length]?.focus();
        break;
      case "Home":
        event.preventDefault();
        items[0]?.focus();
        break;
      case "End":
        event.preventDefault();
        items.at(-1)?.focus();
        break;
      case "Tab":
        setOpen(false);
        break;
    }
  }

  function handleTriggerKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
    }
  }

  return (
    <div ref={rootRef} className="relative flex-none">
      <IconButton
        ref={triggerRef}
        label={`More options for ${title}`}
        icon={<EllipsisVertical aria-hidden="true" size={18} strokeWidth={1.75} />}
        variant="ghost"
        size="sm"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((value) => !value)}
        onKeyDown={handleTriggerKeyDown}
      />

      {open ? (
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          aria-label={`Options for ${title}`}
          onKeyDown={handleMenuKeyDown}
          className="absolute top-[calc(100%+4px)] right-0 z-20 flex w-44 flex-col gap-1 rounded-lg bg-surface p-2 shadow-float"
        >
          <button type="button" role="menuitem" onClick={() => choose(onEdit)} className={itemClassName}>
            <Pencil aria-hidden="true" size={18} strokeWidth={1.75} />
            Edit
          </button>
          <button type="button" role="menuitem" onClick={() => choose(onDelete)} className={itemClassName}>
            <Trash2 aria-hidden="true" size={18} strokeWidth={1.75} />
            Delete
          </button>
        </div>
      ) : null}
    </div>
  );
}
