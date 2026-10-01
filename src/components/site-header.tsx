import Link from "next/link";
import { Button } from "@/components/ui/button";

function LogoMark() {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 32 32"
      aria-hidden="true"
      focusable="false"
      className="shrink-0"
    >
      <path
        d="M16 2l3.2 4.6 5.5-1.2.9 5.6 5.2 2.3-2.6 5 2.6 5-5.2 2.3-.9 5.6-5.5-1.2L16 30l-3.2-4.6-5.5 1.2-.9-5.6L1.2 18.7l2.6-5-2.6-5 5.2-2.3.9-5.6 5.5 1.2L16 2z"
        fill="var(--yellow)"
        stroke="var(--ink)"
        strokeWidth="2"
        strokeLinejoin="round"
        
      />
      <circle cx="16" cy="16" r="4.5" fill="var(--paper)" stroke="var(--ink)" strokeWidth="2" />
    </svg>
  );
}

export function SiteHeader() {
  return (
    <header className="border-b-[3px] border-ink bg-paper">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-display text-xl font-bold text-ink">
          <LogoMark />
          <span>AI Accessibility Auditor</span>
        </Link>
        <nav aria-label="Primary">
          <Button variant="secondary" size="sm" href="/">
            New scan
          </Button>
        </nav>
      </div>
    </header>
  );
}
