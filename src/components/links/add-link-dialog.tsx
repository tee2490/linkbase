"use client";

import { useActionState, useState } from "react";
import { Plus } from "lucide-react";

import { addLink, type AddLinkResult } from "@/app/(dashboard)/dashboard/actions";
import { LINK_TITLE_MAX_LENGTH } from "@/lib/validation/link";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

const initialState: AddLinkResult = { status: "idle" };

type LinkFieldsProps = {
  idPrefix: string;
  errors: Partial<Record<"title" | "url", string[]>>;
  defaultTitle?: string;
  defaultUrl?: string;
  autoFocus?: boolean;
};

// Title and URL inputs with inline errors, shared by the add dialog and inline edit.
export function LinkFields({
  idPrefix,
  errors,
  defaultTitle,
  defaultUrl,
  autoFocus = false,
}: LinkFieldsProps) {
  const titleId = `${idPrefix}-title`;
  const urlId = `${idPrefix}-url`;

  return (
    <>
      <div className="flex flex-col gap-1.5">
        <label htmlFor={titleId} className="text-14 font-medium text-fg-secondary">
          Title
        </label>
        <Input
          id={titleId}
          name="title"
          defaultValue={defaultTitle}
          required
          maxLength={LINK_TITLE_MAX_LENGTH}
          autoComplete="off"
          autoFocus={autoFocus}
          invalid={!!errors.title}
          aria-invalid={!!errors.title}
          aria-describedby={errors.title ? `${titleId}-error` : undefined}
        />
        {errors.title && (
          <p id={`${titleId}-error`} className="text-13 text-danger">
            {errors.title[0]}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor={urlId} className="text-14 font-medium text-fg-secondary">
          URL
        </label>
        <Input
          id={urlId}
          name="url"
          type="url"
          inputMode="url"
          defaultValue={defaultUrl}
          required
          placeholder="https://"
          autoComplete="url"
          invalid={!!errors.url}
          aria-invalid={!!errors.url}
          aria-describedby={errors.url ? `${urlId}-error` : undefined}
        />
        {errors.url && (
          <p id={`${urlId}-error`} className="text-13 text-danger">
            {errors.url[0]}
          </p>
        )}
      </div>
    </>
  );
}

type AddLinkFormProps = {
  onAdded: () => void;
};

function AddLinkForm({ onAdded }: AddLinkFormProps) {
  const [state, formAction, pending] = useActionState(
    async (prev: AddLinkResult, formData: FormData) => {
      const result = await addLink(prev, formData);
      if (result.status === "success") onAdded();
      return result;
    },
    initialState,
  );
  const errors = state.status === "error" ? state.fieldErrors : {};
  const formError = state.status === "error" ? state.formError : undefined;

  return (
    <form action={formAction} noValidate className="flex flex-col gap-4">
      <LinkFields idPrefix="add-link" errors={errors} autoFocus />
      {formError && (
        <p role="alert" className="text-14 text-danger">
          {formError}
        </p>
      )}
      <Button type="submit" fullWidth disabled={pending}>
        {pending ? "Adding…" : "Add"}
      </Button>
    </form>
  );
}

export function AddLinkDialog() {
  const [open, setOpen] = useState(false);
  // A new key per opening remounts the form, so old errors and values don't come back.
  const [formKey, setFormKey] = useState(0);

  function openDialog() {
    setFormKey((key) => key + 1);
    setOpen(true);
  }

  return (
    <>
      <Button fullWidth onClick={openDialog}>
        <Plus size={18} strokeWidth={2} aria-hidden="true" />
        Add
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)} title="Add link">
        <AddLinkForm key={formKey} onAdded={() => setOpen(false)} />
      </Dialog>
    </>
  );
}
