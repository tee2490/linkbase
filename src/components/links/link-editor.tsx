import type { LinkItem } from "@/lib/db/queries/links";
import { Avatar } from "@/components/ui/avatar";

import { AddLinkDialog } from "./add-link-dialog";
import { LinkRow } from "./link-row";

type LinkEditorProps = {
  name: string;
  links: LinkItem[];
};

export function LinkEditor({ name, links }: LinkEditorProps) {
  return (
    <>
      <div className="my-6 flex items-center gap-4">
        <Avatar name={name} size={64} />
        <span className="text-[17px] leading-none font-medium">{name}</span>
      </div>

      <AddLinkDialog />

      {links.length > 0 ? (
        <ul className="mt-6 flex flex-col gap-3.5" aria-label="Your links">
          {links.map((link) => (
            <LinkRow key={link.id} id={link.id} title={link.title} url={link.url} />
          ))}
        </ul>
      ) : (
        <p className="mt-6 rounded-xl border border-dashed border-border-strong p-8 text-center text-15 text-fg-muted">
          No links yet. Add your first one.
        </p>
      )}
    </>
  );
}
