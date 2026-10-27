"use client";

import { Plus } from "lucide-react";
import { useActionState, useState } from "react";

import { createLink } from "@/app/(dashboard)/dashboard/actions";
import { FormError } from "@/components/auth/form-error";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { ActionResult } from "@/lib/types/action-result";

export function AddLinkDialog() {
  const [open, setOpen] = useState(false);
  // Remounts the form on every open, so old values and errors never reappear.
  const [formKey, setFormKey] = useState(0);

  function close() {
    setOpen(false);
    setFormKey((key) => key + 1);
  }

  return (
    <>
      <Button
        variant="app"
        size="md"
        icon={<Plus aria-hidden="true" size={20} strokeWidth={2} />}
        onClick={() => setOpen(true)}
        className="w-full"
      >
        Add
      </Button>
      <Dialog open={open} onClose={close} title="Add a link">
        <AddLinkForm key={formKey} onCancel={close} onAdded={close} />
      </Dialog>
    </>
  );
}

type AddLinkFormProps = {
  onCancel: () => void;
  onAdded: () => void;
};

function AddLinkForm({ onCancel, onAdded }: AddLinkFormProps) {
  const [state, formAction, pending] = useActionState(
    async (prev: ActionResult | null, formData: FormData) => {
      const result = await createLink(prev, formData);
      if (result.ok) onAdded();
      return result;
    },
    null,
  );
  // Controlled, so typed values survive the form reset after a failed submit.
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const fieldErrors = state?.ok === false ? state.fieldErrors : undefined;

  return (
    <form action={formAction} noValidate className="flex flex-col gap-5">
      <Input
        id="add-link-title"
        name="title"
        label="Title"
        variant="field"
        autoComplete="off"
        required
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        error={fieldErrors?.title?.[0]}
      />
      <Input
        id="add-link-url"
        name="url"
        type="url"
        inputMode="url"
        label="URL"
        variant="field"
        placeholder="https://"
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
        <Button variant="muted" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="app" size="sm" disabled={pending}>
          {pending ? "Adding…" : "Add link"}
        </Button>
      </div>
    </form>
  );
}
