"use client";

import { addInspectionTagAction } from "@/actions/condition";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";

type Tag = { id: string; x: number; y: number; label: string; severity: string };

export function ConditionTagger({
  inspectionId,
  imageUrl,
  tags,
}: {
  inspectionId: string;
  imageUrl: string;
  tags: Tag[];
}) {
  const [pending, setPending] = useState<{ x: number; y: number } | null>(null);

  return (
    <div className="space-y-3">
      <button
        type="button"
        className="relative block w-full overflow-hidden rounded-xl border"
        onClick={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          setPending({
            x: (event.clientX - rect.left) / rect.width,
            y: (event.clientY - rect.top) / rect.height,
          });
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageUrl} alt="Inspection" className="h-72 w-full object-cover" />
        {tags.map((tag) => (
          <span
            key={tag.id}
            className="absolute size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-red-500"
            style={{ left: `${tag.x * 100}%`, top: `${tag.y * 100}%` }}
            title={tag.label}
          />
        ))}
        {pending ? (
          <span
            className="absolute size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-sky-500"
            style={{ left: `${pending.x * 100}%`, top: `${pending.y * 100}%` }}
          />
        ) : null}
      </button>
      {pending ? (
        <form action={addInspectionTagAction} className="flex flex-wrap items-end gap-2">
          <input type="hidden" name="inspectionId" value={inspectionId} />
          <input type="hidden" name="x" value={pending.x} />
          <input type="hidden" name="y" value={pending.y} />
          <Input name="label" placeholder="Door ding, curb rash…" className="min-w-48 flex-1" />
          <select name="severity" className="h-9 rounded-md border bg-background px-2 text-sm">
            <option value="NOTE">Note</option>
            <option value="MINOR">Minor</option>
            <option value="MAJOR">Major</option>
          </select>
          <Button type="submit" size="sm">
            Tag damage
          </Button>
        </form>
      ) : (
        <p className="text-xs text-muted-foreground">Click the photo to drop a damage tag.</p>
      )}
      <ul className="text-sm">
        {tags.map((tag) => (
          <li key={tag.id}>
            {tag.label} · {tag.severity.toLowerCase()}
          </li>
        ))}
      </ul>
    </div>
  );
}
