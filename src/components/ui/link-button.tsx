type LinkButtonProps = {
  title: string;
  href?: string;
};

const BASE_CLASSES =
  "flex min-h-14 w-full items-center justify-center rounded-lg bg-surface-card px-[52px] py-2 text-center text-16 font-medium leading-[1.3] text-balance text-fg no-underline";

// Without an href it renders as a static row, e.g. for marketing previews.
export function LinkButton({ title, href }: LinkButtonProps) {
  if (!href) {
    return <div className={BASE_CLASSES}>{title}</div>;
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer nofollow ugc"
      className={`${BASE_CLASSES} transition duration-120 ease-out hover:shadow-float motion-safe:hover:-translate-y-px motion-safe:active:scale-[.985] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2`}
    >
      {title}
    </a>
  );
}
