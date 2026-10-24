"use client";

import {
  startTransition,
  useActionState,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { EllipsisVertical, Link2, Pencil, Trash2 } from "lucide-react";

import {
  deleteLink,
  updateLink,
  type UpdateLinkResult,
} from "@/app/(dashboard)/dashboard/actions";
import { getDomain, getSafeHref } from "@/lib/url";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { IconButton } from "@/components/ui/icon-button";

import { LinkFields } from "./add-link-dialog";

const initialUpdateState: UpdateLinkResult = { status: "idle" };

const MENU_ITEM_CLASSES =
  "flex w-full items-center gap-2.5 rounded-sm px-3 py-2.5 text-left text-15 font-medium transition-colors duration-120 ease-out hover:bg-surface-chip focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink";

type LinkRowProps = {
  id: string;
  title: string;
  url: string;
};

export function LinkRow({ id, title, url }: LinkRowProps) {
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  if (editing) {
    return (
      <EditLinkForm
        id={id}
        title={title}
        url={url}
        onDone={() => setEditing(false)}
      />
    );
  }

  const href = getSafeHref(url);

  return (
    <li className="flex items-center gap-4 rounded-xl border border-border-subtle bg-surface-card py-4 pr-4 pl-5">
      <span className="flex size-12 shrink-0 items-center justify-center rounded-sm bg-surface-chip text-fg-muted shadow-card">
        <Link2 size={22} strokeWidth={1.75} aria-hidden="true" />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="m-0 truncate text-16 leading-[1.25] font-medium">{title}</p>
        {href ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer nofollow ugc"
            className="truncate text-14 text-fg-muted underline-offset-2 hover:underline"
          >
            {getDomain(url)}
          </a>
        ) : (
          <p className="m-0 truncate text-14 text-fg-muted">{getDomain(url)}</p>
        )}
      </div>
      <RowMenu
        title={title}
        onEdit={() => setEditing(true)}
        onDelete={() => setConfirmingDelete(true)}
      />
      <DeleteLinkDialog
        id={id}
        title={title}
        open={confirmingDelete}
        onClose={() => setConfirmingDelete(false)}
      />
    </li>
  );
}

type RowMenuProps = {
  title: string;
  onEdit: () => void;
  onDelete: () => void;
};

// A disclosure like the header's UserMenu: a button and a small panel of actions.
function RowMenu({ title, onEdit, onDelete }: RowMenuProps) {
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

  function choose(action: () => void) {
    setOpen(false);
    action();
  }

  return (
    <div ref={containerRef} className="relative" onKeyDown={handleKeyDown}>
      <IconButton
        ref={triggerRef}
        icon={EllipsisVertical}
        label={`More options for ${title}`}
        variant="plain"
        size={32}
        aria-expanded={open}
        aria-controls={panelId}
        className="text-fg-secondary"
        onClick={() => setOpen((value) => !value)}
      />
      <div
        id={panelId}
        hidden={!open}
        className="absolute top-[calc(100%+4px)] right-0 z-20 w-40 rounded-lg bg-surface-card p-1.5 shadow-pop"
      >
        <button type="button" className={`${MENU_ITEM_CLASSES} text-fg`} onClick={() => choose(onEdit)}>
          <Pencil size={18} strokeWidth={1.75} aria-hidden="true" />
          Edit
        </button>
        <button
          type="button"
          className={`${MENU_ITEM_CLASSES} text-danger`}
          onClick={() => choose(onDelete)}
        >
          <Trash2 size={18} strokeWidth={1.75} aria-hidden="true" />
          Delete
        </button>
      </div>
    </div>
  );
}

type EditLinkFormProps = LinkRowProps & {
  onDone: () => void;
};

function EditLinkForm({ id, title, url, onDone }: EditLinkFormProps) {
  const [state, formAction, pending] = useActionState(
    async (prev: UpdateLinkResult, formData: FormData) => {
      const result = await updateLink(prev, formData);
      if (result.status === "success") onDone();
      return result;
    },
    initialUpdateState,
  );
  const errors = state.status === "error" ? state.fieldErrors : {};
  const formError = state.status === "error" ? state.formError : undefined;

  function handleKeyDown(event: KeyboardEvent<HTMLFormElement>) {
    if (event.key === "Escape") onDone();
  }

  return (
    <li className="rounded-xl border border-border-subtle bg-surface-card p-5">
      <form
        action={formAction}
        noValidate
        onKeyDown={handleKeyDown}
        aria-label={`Edit ${title}`}
        className="flex flex-col gap-4"
      >
        <input type="hidden" name="linkId" value={id} />
        <LinkFields
          idPrefix={`edit-${id}`}
          errors={errors}
          defaultTitle={title}
          defaultUrl={url}
          autoFocus
        />
        {formError && (
          <p role="alert" className="text-14 text-danger">
            {formError}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={onDone}>
            Cancel
          </Button>
          <Button type="submit" size="sm" disabled={pending}>
            {pending ? "Saving…" : "Save"}
          </Button>
        </div>
      </form>
    </li>
  );
}

type DeleteLinkDialogProps = {
  id: string;
  title: string;
  open: boolean;
  onClose: () => void;
};

function DeleteLinkDialog({ id, title, open, onClose }: DeleteLinkDialogProps) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();

  function handleClose() {
    setError(undefined);
    onClose();
  }

  function confirmDelete() {
    setPending(true);
    startTransition(async () => {
      const result = await deleteLink(id);
      // On success the row unmounts when the page re-renders without it.
      if (result.status === "error") {
        setError(result.formError);
        setPending(false);
      }
    });
  }

  return (
    <Dialog open={open} onClose={handleClose} title="Delete link?" role="alertdialog">
      <p className="m-0 text-15 leading-relaxed text-fg-muted">
        Delete “<span className="font-semibold text-fg">{title}</span>”? This can&apos;t be undone.
      </p>
      {error && (
        <p role="alert" className="mt-3 text-14 text-danger">
          {error}
        </p>
      )}
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="secondary" size="sm" onClick={handleClose}>
          Cancel
        </Button>
        <Button
          size="sm"
          disabled={pending}
          onClick={confirmDelete}
          className="bg-danger hover:bg-danger/90"
        >
          {pending ? "Deleting…" : "Delete"}
        </Button>
      </div>
    </Dialog>
  );
}
