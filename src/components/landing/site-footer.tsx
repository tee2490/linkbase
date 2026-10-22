// Placeholder targets until these pages exist (out of scope in plans/feat/landing-page.md).
const FOOTER_LINKS = ["Help centre", "Privacy", "Terms", "Contact"];

export function SiteFooter() {
  return (
    <footer className="bg-white px-[clamp(20px,5vw,40px)] py-8">
      <div className="mx-auto flex max-w-content flex-wrap items-center justify-between gap-x-8 gap-y-5">
        <span className="font-display text-24 leading-none font-extrabold tracking-[-0.04em]">
          linkbase
        </span>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2 text-15 leading-normal font-medium">
          {FOOTER_LINKS.map((label) => (
            <a
              key={label}
              href="#"
              className="rounded-xs text-ink no-underline hover:text-ink-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink"
            >
              {label}
            </a>
          ))}
        </nav>
        <span className="text-14 leading-normal text-fg-muted">© 2026 Linkbase</span>
      </div>
    </footer>
  );
}
