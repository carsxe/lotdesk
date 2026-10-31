import { Badge } from "@/components/ui/badge";
import type { CallMeta } from "@/server/carsxe";
import { usageTotals } from "@/server/carsxe";

export function UsageRibbon({ usage }: { usage: CallMeta[] }) {
  const totals = usageTotals(usage);
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-card px-3 py-2 text-sm">
      <span className="font-medium">CarsXE usage</span>
      <Badge variant="outline">{totals.total} calls this action</Badge>
      <Badge variant={totals.billed ? "default" : "secondary"}>
        {totals.billed} billed
      </Badge>
      <Badge variant="outline">{totals.cached} cache hits</Badge>
      {totals.demo ? <Badge variant="secondary">Demo · $0</Badge> : null}
      <span className="text-muted-foreground">
        Cached VIN/plate lookups are reused so the same request is not billed twice.
      </span>
    </div>
  );
}

export function EndpointPills({ usage }: { usage: CallMeta[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {usage.map((item, index) => (
        <Badge key={`${item.endpoint}-${index}`} variant="outline">
          {item.endpoint}
          {item.cacheHit ? " · cache" : item.demo ? " · demo" : " · live"}
        </Badge>
      ))}
    </div>
  );
}
