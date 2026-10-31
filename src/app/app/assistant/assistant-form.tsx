"use client";

import type { AssistantResult } from "@/actions/assistant";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useActionState } from "react";

export function AssistantForm({
  action,
}: {
  action: (prev: AssistantResult | null, formData: FormData) => Promise<AssistantResult>;
}) {
  const [state, formAction, pending] = useActionState(action, null);
  return (
    <div className="space-y-3">
      <form action={formAction} className="flex gap-2">
        <Input
          name="prompt"
          placeholder="reprice my 60+ day units to market"
          defaultValue="which units need photos"
        />
        <Button type="submit" disabled={pending}>
          {pending ? "Working…" : "Run"}
        </Button>
      </form>
      {state ? (
        <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm">
          <p className="font-medium">{state.reply}</p>
          <ul className="mt-2 space-y-1">
            {state.items.map((item) => (
              <li key={item.id}>
                {item.label} · {item.detail}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          Try “reprice my 60+ day units to market”, “which units need photos”, or “how is the lot”.
        </p>
      )}
    </div>
  );
}
