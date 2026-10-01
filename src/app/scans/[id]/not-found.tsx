import { ScribbleBlob } from "@/components/doodles";
import { Button } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-ink bg-paper px-6 py-10 text-center">
      <ScribbleBlob className="h-28 w-28" />
      <h1 className="font-display text-4xl font-bold text-ink">Scan not found</h1>
      <p className="max-w-prose text-ink-2">This scan may have been deleted or the link is incomplete.</p>
      <div className="mt-2">
        <Button href="/" variant="primary">
          Back to home
        </Button>
      </div>
    </div>
  );
}
