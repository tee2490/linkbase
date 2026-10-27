"use client";

import { Link as LinkIcon } from "lucide-react";
import { useActionState, useState } from "react";

import { updateLink } from "@/app/(dashboard)/dashboard/actions";
import { FormError } from "@/components/auth/form-error";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "@/components/ui/external-link";
import { Input } from "@/components/ui/input";
import { displayHost } from "@/lib/links/display-host";
import type { ActionResult } from "@/lib/types/action-result";
import type { LinkItem } from "@/lib/types/link";

import { DeleteLinkDialog } from "./delete-link-dialog";
import { LinkRowMenu } from "./link-row-menu";

type LinkRowProps = {
  link: LinkItem;
  editing: boolean;
  onEdit: () => void;
  onDoneEditing: () => void;
};

const cardClassName =
  "rounded-lg bg-surface p-4 ring-1 ring-border-strong ring-inset transition duration-150 ease-out";

export function LinkRow({ link, editing, onEdit, onDoneEditing }: LinkRowProps) {
  const [deleting, setDeleting] = useState(false);

  if (editing) {
    return (
      <li className={cardClassName}>
        <EditLinkForm link={link} onDone={onDoneEditing} />
      </li>
    );
  }

  return (
    <li className={`flex min-h-[72px] items-center gap-4 hover:shadow-float ${cardClassName}`}>
      <span
        aria-hidden="true"
        className="flex size-11 flex-none items-center justify-center rounded-md bg-lime-soft text-forest"
      >
        <LinkIcon size={20} strokeWidth={1.75} />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-label font-semibold text-ink-app">{link.title}</span>
        <ExternalLink
          href={link.url}
          className="self-start truncate text-body-sm text-muted-app underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          {displayHost(link.url)}
        </ExternalLink>
      </div>
      <LinkRowMenu title={link.title} onEdit={onEdit} onDelete={() => setDeleting(true)} />
      <DeleteLinkDialog
        open={deleting}
        onClose={() => setDeleting(false)}
        linkId={link.id}
        title={link.title}
      />
    </li>
  );
}

type EditLinkFormProps = {
  link: LinkItem;
  onDone: () => void;
};

function EditLinkForm({ link, onDone }: EditLinkFormProps) {
  const [state, formAction, pending] = useActionState(
    async (prev: ActionResult | null, formData: FormData) => {
      const result = await updateLink(prev, formData);
      if (result.ok) onDone();
      return result;
    },
    null,
  );
  // Controlled, so edits survive the form reset after a failed save.
  const [title, setTitle] = useState(link.title);
  const [url, setUrl] = useState(link.url);
  const fieldErrors = state?.ok === false ? state.fieldErrors : undefined;
  const idPrefix = `edit-link-${link.id}`;

  return (
    <form
      action={formAction}
      noValidate
      aria-label={`Edit ${link.title}`}
      onKeyDown={(event) => {
        if (event.key === "Escape") onDone();
      }}
      className="flex flex-col gap-4"
    >
      <input type="hidden" name="linkId" value={link.id} />
      <Input
        id={`${idPrefix}-title`}
        name="title"
        label="Title"
        variant="field"
        autoComplete="off"
        autoFocus
        required
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        error={fieldErrors?.title?.[0]}
      />
      <Input
        id={`${idPrefix}-url`}
        name="url"
        type="url"
        inputMode="url"
        label="URL"
        variant="field"
        autoComplete="off"
        autoCapitalize="none"
        spellCheck={false}
        required
        value={url}
        onChange={(event) => setUrl(event.target.value)}
        error={fieldErrors?.url?.[0]}
      />
      <FormError message={state?.ok === false ? state.formError : undefined} />
      <div className="flex justify-end gap-3">
        <Button variant="muted" size="sm" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" variant="app" size="sm" disabled={pending}>
          {pending ? "Saving…" : "Save"}
        </Button>
      </div>
    </form>
  );
}
