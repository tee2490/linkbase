"use client";

import { useState } from "react";

import type { LinkItem } from "@/lib/types/link";

import { LinkRow } from "./link-row";

type LinkListProps = {
  links: LinkItem[];
};

export function LinkList({ links }: LinkListProps) {
  // One row in edit mode at a time.
  const [editingId, setEditingId] = useState<string | null>(null);

  if (links.length === 0) {
    return (
      <p className="m-0 rounded-lg border-2 border-dashed border-border-strong px-4 py-10 text-center text-body-md text-muted-app">
        No links yet. Add your first one.
      </p>
    );
  }

  return (
    <ul aria-label="Your links" className="m-0 flex list-none flex-col gap-4 p-0">
      {links.map((link) => (
        <LinkRow
          key={link.id}
          link={link}
          editing={editingId === link.id}
          onEdit={() => setEditingId(link.id)}
          onDoneEditing={() => setEditingId(null)}
        />
      ))}
    </ul>
  );
}
