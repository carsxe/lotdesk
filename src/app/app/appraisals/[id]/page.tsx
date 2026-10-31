import { stockAppraisalAction, updateAppraisalStatus } from "@/actions/desk";
import { AppraisalStatusBadge } from "@/components/status-badges";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMoney } from "@/lib/money";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/server/session";
import { notFound, redirect } from "next/navigation";

export default async function AppraisalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const appraisal = await prisma.appraisal.findFirst({
    where: { id, organizationId: user.organizationId },
    include: { rooftop: true, appraiser: true },
  });
  if (!appraisal) notFound();

  async function stock() {
    "use server";
    const result = await stockAppraisalAction(id);
    if (result && "vehicleId" in result && result.vehicleId) {
      redirect(`/app/inventory/${result.vehicleId}`);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">
            {appraisal.year} {appraisal.make} {appraisal.model} {appraisal.trim}
          </h1>
          <p className="font-mono text-sm text-muted-foreground">{appraisal.vin}</p>
        </div>
        <AppraisalStatusBadge status={appraisal.status} />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Offer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="text-2xl font-semibold">{formatMoney(appraisal.offerCents)}</p>
            <p>Customer: {appraisal.customerName ?? "—"}</p>
            <p>Mileage: {appraisal.mileage.toLocaleString()}</p>
            <p>Condition: {appraisal.condition.toLowerCase()}</p>
            <p>Rooftop: {appraisal.rooftop.name}</p>
            <p>Appraiser: {appraisal.appraiser.name}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>CarsXE market</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>Retail: {formatMoney(appraisal.marketRetailCents)}</p>
            <p>Wholesale: {formatMoney(appraisal.marketWholesaleCents)}</p>
            <p>Trade-in: {formatMoney(appraisal.marketTradeInCents)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>History & risk</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">{appraisal.historySummary}</CardContent>
        </Card>
      </div>
      {appraisal.notes ? (
        <Card>
          <CardContent className="pt-6 text-sm">{appraisal.notes}</CardContent>
        </Card>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <form
          action={async () => {
            "use server";
            await updateAppraisalStatus(id, "ACCEPTED");
          }}
        >
          <Button type="submit" variant="outline">
            Mark accepted
          </Button>
        </form>
        <form
          action={async () => {
            "use server";
            await updateAppraisalStatus(id, "DECLINED");
          }}
        >
          <Button type="submit" variant="outline">
            Decline
          </Button>
        </form>
        <form action={stock}>
          <Button type="submit">Stock to inventory</Button>
        </form>
      </div>
    </div>
  );
}
