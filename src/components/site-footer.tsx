import { DotsRow } from "@/components/doodles";

export function SiteFooter() {
  return (
    <footer className="border-t-[3px] border-ink bg-paper py-6 text-center text-sm text-ink-2">
      <div className="flex flex-col items-center gap-2">
        <DotsRow className="h-3 w-20 text-yellow" />
        <p>Built by Arshita</p>
      </div>
    </footer>
  );
}
