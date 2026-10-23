"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import Link from "next/link";
import { ChevronDown, LayoutDashboard, LogOut } from "lucide-react";

import { signOutUser } from "@/app/(auth)/actions";
import { Avatar } from "@/components/ui/avatar";

type UserMenuProps = {
  displayName: string;
  email: string;
};

const ITEM_CLASSES =
  "flex w-full items-center gap-2.5 rounded-sm px-3 py-2.5 text-left text-15 font-medium text-fg transition-colors duration-120 ease-out hover:bg-surface-chip focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink";

// A disclosure (button + panel) rather than an ARIA menu: it holds a link and a form
// button, and works with Tab and Escape without roving focus.
export function UserMenu({ displayName, email }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape" && open) {
      setOpen(false);
      triggerRef.current?.focus();
    }
  }

  return (
    <div ref={containerRef} className="relative" onKeyDown={handleKeyDown}>
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={`Account menu for ${displayName}`}
        onClick={() => setOpen((value) => !value)}
        className="flex h-9 items-center gap-1 rounded-full py-0.5 pr-2 pl-0.5 transition-colors duration-120 ease-out hover:bg-surface-chip focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2"
      >
        <Avatar name={displayName} size={32} />
        <ChevronDown
          size={16}
          strokeWidth={2}
          aria-hidden="true"
          className={`text-fg-secondary transition-transform duration-200 motion-reduce:transition-none ${open ? "rotate-180" : ""}`}
        />
      </button>

      <div
        id={panelId}
        hidden={!open}
        className="absolute top-[calc(100%+8px)] right-0 z-20 w-64 rounded-lg bg-surface-card p-1.5 shadow-pop"
      >
        <div className="border-b border-border-subtle px-3 pt-2 pb-3">
          <p className="truncate text-15 font-semibold text-fg">{displayName}</p>
          <p className="truncate text-13 text-fg-muted">{email}</p>
        </div>
        <ul className="pt-1.5">
          <li>
            <Link href="/dashboard" className={ITEM_CLASSES} onClick={() => setOpen(false)}>
              <LayoutDashboard size={18} strokeWidth={1.75} aria-hidden="true" />
              Dashboard
            </Link>
          </li>
          <li>
            <form action={signOutUser}>
              <button type="submit" className={ITEM_CLASSES}>
                <LogOut size={18} strokeWidth={1.75} aria-hidden="true" />
                Log out
              </button>
            </form>
          </li>
        </ul>
      </div>
    </div>
  );
}
