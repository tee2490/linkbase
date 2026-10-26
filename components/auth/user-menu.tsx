"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { ChevronDown, LayoutDashboard, LogOut } from "lucide-react";

import { signOutUser } from "@/app/_actions/auth";

type UserMenuProps = {
  email: string;
};

const itemClassName =
  "flex w-full items-center gap-3 rounded-sm px-3 py-2.5 text-left text-label text-ink-app outline-none hover:bg-surface-muted focus-visible:bg-surface-muted";

export function UserMenu({ email }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const initial = email.charAt(0).toUpperCase();

  useEffect(() => {
    if (!open) return;
    menuRef.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();

    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  function closeAndFocusTrigger() {
    setOpen(false);
    triggerRef.current?.focus();
  }

  function handleMenuKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const items = Array.from(menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? []);
    const index = items.indexOf(document.activeElement as HTMLElement);

    switch (event.key) {
      case "Escape":
        event.preventDefault();
        closeAndFocusTrigger();
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
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((value) => !value)}
        onKeyDown={handleTriggerKeyDown}
        className="flex h-control-sm items-center gap-2 rounded-full bg-surface-soft pr-3 pl-1 text-ink transition duration-150 ease-out hover:brightness-[.94] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
      >
        <span
          aria-hidden="true"
          className="flex size-9 items-center justify-center rounded-full bg-orchid font-display text-[16px] font-extrabold"
        >
          {initial}
        </span>
        <span className="sr-only">Account menu for </span>
        <span className="max-w-[180px] truncate text-label max-sm:sr-only">{email}</span>
        <ChevronDown
          aria-hidden="true"
          size={18}
          strokeWidth={1.75}
          className={`transition-transform duration-150 ease-out ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open ? (
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          aria-label="Account"
          onKeyDown={handleMenuKeyDown}
          className="absolute top-[calc(100%+8px)] right-0 z-20 flex w-64 flex-col gap-1 rounded-lg bg-surface p-2 text-left shadow-float"
        >
          <p role="none" className="m-0 truncate px-3 pt-2 pb-1 text-body-sm text-muted">
            {email}
          </p>
          <Link href="/dashboard" role="menuitem" onClick={() => setOpen(false)} className={itemClassName}>
            <LayoutDashboard aria-hidden="true" size={18} strokeWidth={1.75} />
            Dashboard
          </Link>
          <form action={signOutUser} role="none">
            <button type="submit" role="menuitem" className={itemClassName}>
              <LogOut aria-hidden="true" size={18} strokeWidth={1.75} />
              Sign out
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
