import { submitBetaFeedbackAction } from "@/actions/lab";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function BetaBanner({ flagKey, name }: { flagKey: string; name: string }) {
  return (
    <div className="rounded-md border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-950">
      <p className="font-medium">{name} is a Lab feature</p>
      <p className="text-xs text-sky-900/80">Opt-in per rooftop group. Send a rating so we know if it stays.</p>
      <form action={submitBetaFeedbackAction} className="mt-2 flex flex-wrap items-end gap-2">
        <input type="hidden" name="flagKey" value={flagKey} />
        <select name="rating" defaultValue="4" className="h-9 rounded-md border bg-background px-2 text-sm">
          <option value="1">1 — not useful</option>
          <option value="2">2</option>
          <option value="3">3</option>
          <option value="4">4</option>
          <option value="5">5 — keep it</option>
        </select>
        <Textarea name="comment" rows={1} placeholder="What worked?" className="min-h-9 min-w-56 flex-1" />
        <Button type="submit" size="sm" variant="outline">
          Send feedback
        </Button>
      </form>
    </div>
  );
}
