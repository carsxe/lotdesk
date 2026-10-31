import { Badge } from "@/components/ui/badge";
import type { TurnRecommendation } from "@/lib/turn-score";

const STYLES: Record<TurnRecommendation, string> = {
  RETAIL_HOLD: "bg-emerald-100 text-emerald-900 border-emerald-200",
  PRICE_DOWN: "bg-amber-100 text-amber-950 border-amber-200",
  WHOLESALE_SOON: "bg-orange-100 text-orange-950 border-orange-200",
  WHOLESALE_NOW: "bg-red-100 text-red-900 border-red-200",
  DONT_BUY: "bg-slate-200 text-slate-800 border-slate-300",
};

export function TurnScoreBadge({
  score,
  recommendation,
  label,
}: {
  score: number;
  recommendation: TurnRecommendation;
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <Badge variant="outline" className="font-mono">
        {score}
      </Badge>
      <Badge variant="outline" className={STYLES[recommendation]}>
        {label}
      </Badge>
    </span>
  );
}

export function StockingBadge({ action }: { action: "BUY" | "AT_TARGET" | "OVERSTOCK" }) {
  const map = {
    BUY: { label: "Buy more", className: "bg-emerald-100 text-emerald-900 border-emerald-200" },
    AT_TARGET: { label: "At target", className: "bg-slate-100 text-slate-800 border-slate-200" },
    OVERSTOCK: { label: "Overstocked", className: "bg-red-100 text-red-900 border-red-200" },
  };
  return (
    <Badge variant="outline" className={map[action].className}>
      {map[action].label}
    </Badge>
  );
}
