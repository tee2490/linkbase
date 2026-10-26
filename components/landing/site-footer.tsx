import Link from "next/link";

const FOOTER_COLUMNS = [
  { title: "Product", links: ["Features", "Pricing", "Templates"] },
  { title: "Company", links: ["About", "Blog", "Careers"] },
  { title: "Support", links: ["Help center", "Contact", "Status"] },
] as const;

const LEGAL_LINKS = ["Privacy", "Terms", "Cookies"] as const;

const linkClassName =
  "rounded-sm hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus";

export function SiteFooter() {
  return (
    <footer className="bg-grape pb-12">
      <div className="px-5 sm:px-10 lg:px-18">
        <div className="mx-auto flex max-w-container flex-col gap-12 rounded-lg bg-surface px-6 py-8 text-ink sm:px-16 sm:pt-14 sm:pb-10">
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 sm:gap-10 lg:grid-cols-[minmax(0,1.6fr)_repeat(3,minmax(0,1fr))]">
            <div className="col-span-full flex flex-col gap-3 lg:col-span-1">
              <Link
                href="/"
                className="self-start rounded-sm font-display text-[28px] font-extrabold tracking-[-0.02em] text-ink [font-stretch:112%] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
              >
                Linkbase
              </Link>
              <p className="m-0 max-w-[300px] text-body-sm text-muted">One link for everything you make.</p>
            </div>
            {FOOTER_COLUMNS.map((column) => (
              <nav key={column.title} aria-label={column.title} className="flex flex-col gap-3">
                <h3 className="m-0 mb-1 text-[18px] leading-6 font-semibold">{column.title}</h3>
                {column.links.map((label) => (
                  <a key={label} href="#" className={`self-start text-body-sm text-muted ${linkClassName}`}>
                    {label}
                  </a>
                ))}
              </nav>
            ))}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-4 border-t border-border pt-6 text-body-sm text-muted">
            <span>© 2026 Linkbase</span>
            <div className="flex gap-6">
              {LEGAL_LINKS.map((label) => (
                <a key={label} href="#" className={linkClassName}>
                  {label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
