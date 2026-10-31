"use client";

import { useMemo, useState } from "react";

export function SpinViewer({
  frames,
  label,
}: {
  frames: { index: number; url: string }[];
  label: string;
}) {
  const ordered = useMemo(() => [...frames].sort((a, b) => a.index - b.index), [frames]);
  const [index, setIndex] = useState(0);
  const current = ordered[index] ?? ordered[0];

  if (!current) {
    return <p className="text-sm text-muted-foreground">No spin frames on this unit yet.</p>;
  }

  return (
    <div className="space-y-3">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={current.url} alt={label} className="h-72 w-full rounded-xl border object-cover" />
      <input
        type="range"
        min={0}
        max={Math.max(0, ordered.length - 1)}
        value={index}
        onChange={(event) => setIndex(Number(event.target.value))}
        className="w-full"
      />
      <p className="text-xs text-muted-foreground">
        Frame {index + 1} of {ordered.length} · drag to rotate
      </p>
    </div>
  );
}
