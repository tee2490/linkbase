"use client";

import { useState, useTransition } from "react";

import { deleteLink } from "@/app/(dashboard)/dashboard/actions";
import { FormError } from "@/components/auth/form-error";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";

type DeleteLinkDialogProps = {
  open: boolean;
  onClose: () => void;
  linkId: string;
  title: string;
};

export function DeleteLinkDialog({ open, onClose, linkId, title }: DeleteLinkDialogProps) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>();

  function close() {
    setError(undefined);
    onClose();
  }

  function confirm() {
    startTransition(async () => {
      const result = await deleteLink({ linkId });
      // On success the row unmounts with the revalidated list, taking this dialog with it.
      if (result.ok) close();
      else setError(result.formError ?? "Couldn't delete this link. Try again.");
    });
  }

  return (
    <Dialog
      open={open}
      onClose={close}
      title="Delete this link?"
      description={<>&ldquo;{title}&rdquo; will be removed from your page.</>}
    >
      <FormError message={error} />
      <div className="flex justify-end gap-3">
        <Button variant="muted" size="sm" onClick={close} autoFocus>
          Cancel
        </Button>
        <Button variant="app" size="sm" onClick={confirm} disabled={pending}>
          {pending ? "Deleting…" : "Delete"}
        </Button>
      </div>
    </Dialog>
  );
}
