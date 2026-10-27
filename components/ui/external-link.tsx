import type { ReactNode } from "react";

type ExternalLinkProps = {
  href: string;
  children: ReactNode;
  className?: string;
};

// Every link to a user-supplied URL goes through here (docs/security.md).
export function ExternalLink({ href, children, className }: ExternalLinkProps) {
  // Re-check the scheme on render, so an old record can never run javascript:.
  const safe = /^https?:\/\//i.test(href);
  if (!safe) return <span className={className}>{children}</span>;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
      {children}
    </a>
  );
}
