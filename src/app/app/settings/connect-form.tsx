"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useActionState } from "react";

export function ConnectKeyForm({
  action,
}: {
  action: (
    prev: { error?: string; ok?: boolean } | null,
    formData: FormData,
  ) => Promise<{ error?: string; ok?: boolean } | null>;
}) {
  const [state, formAction, pending] = useActionState(action, null);
  return (
    <form action={formAction} className="space-y-3">
      {state?.error ? <p className="text-sm text-red-700">{state.error}</p> : null}
      {state?.ok ? <p className="text-sm text-emerald-800">API key saved and encrypted.</p> : null}
      <div className="space-y-2">
        <Label htmlFor="apiKey">CarsXE API key</Label>
        <Input id="apiKey" name="apiKey" type="password" placeholder="Paste key" required />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="live" />
        Leave demo mode and use this key for live CarsXE calls
      </label>
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save API key"}
      </Button>
    </form>
  );
}
