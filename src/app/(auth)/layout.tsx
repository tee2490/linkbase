import Link from "next/link";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-screen flex-col items-center bg-surface-chip px-4 py-10">
      <Link
        href="/"
        className="rounded-xs font-display text-[26px] leading-none font-extrabold tracking-[-0.04em] text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2"
      >
        linkbase
      </Link>
      <main className="mt-10 w-full max-w-[420px] rounded-xl bg-surface-card px-6 py-8 shadow-panel sm:px-8">
        {children}
      </main>
    </div>
  );
}
