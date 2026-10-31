import { Badge } from "@/components/ui/badge";
import { priceFlagLabel, type PriceFlag } from "@/lib/pricing";
import type { AppraisalStatus, ReconStage, VehicleStatus } from "@prisma/client";

export function VehicleStatusBadge({ status }: { status: VehicleStatus }) {
  const map: Record<VehicleStatus, string> = {
    IN_RECON: "Recon",
    FRONTLINE: "Frontline",
    WHOLESALE: "Wholesale",
    PENDING: "Pending",
    SOLD: "Sold",
  };
  const variant =
    status === "FRONTLINE" ? "default" : status === "SOLD" ? "secondary" : "outline";
  return <Badge variant={variant}>{map[status]}</Badge>;
}

export function ReconBadge({ stage }: { stage: ReconStage }) {
  const map: Record<ReconStage, string> = {
    INTAKE: "Intake",
    MECHANICAL: "Mechanical",
    BODY: "Body",
    DETAIL: "Detail",
    PHOTOS: "Photos",
    READY: "Ready",
  };
  return <Badge variant={stage === "READY" ? "secondary" : "outline"}>{map[stage]}</Badge>;
}

export function AppraisalStatusBadge({ status }: { status: AppraisalStatus }) {
  const map: Record<AppraisalStatus, string> = {
    DRAFT: "Draft",
    OFFERED: "Offered",
    ACCEPTED: "Accepted",
    DECLINED: "Declined",
    STOCKED: "Stocked",
  };
  return <Badge variant={status === "ACCEPTED" || status === "STOCKED" ? "default" : "outline"}>{map[status]}</Badge>;
}

export function PriceFlagBadge({ flag, aging }: { flag: PriceFlag; aging?: boolean }) {
  const color =
    flag === "over"
      ? "bg-red-100 text-red-800 border-red-200"
      : flag === "under"
        ? "bg-amber-100 text-amber-900 border-amber-200"
        : flag === "in-market"
          ? "bg-emerald-100 text-emerald-800 border-emerald-200"
          : "bg-slate-100 text-slate-700 border-slate-200";
  return (
    <span className="inline-flex items-center gap-1">
      <Badge className={color} variant="outline">
        {priceFlagLabel(flag)}
      </Badge>
      {aging ? (
        <Badge className="bg-orange-100 text-orange-900 border-orange-200" variant="outline">
          Aged
        </Badge>
      ) : null}
    </span>
  );
}

export function DemoBanner({ demo }: { demo: boolean }) {
  if (!demo) return null;
  return (
    <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-950">
      Demo mode is on. Lookups use mocked CarsXE responses and do not bill the dealer’s CarsXE account.
    </div>
  );
}
