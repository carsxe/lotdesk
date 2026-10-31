import { PageHeader } from "@/components/page-header";
import { DemoBanner } from "@/components/status-badges";
import { StockingBadge } from "@/components/turn-score-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { daysInStock } from "@/lib/pricing";
import { buildStockingBoard } from "@/lib/stocking";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/server/session";
import Link from "next/link";

export default async function StockingPage() {
  const user = await requireUser();
  const [vehicles, appraisals, rooftops] = await Promise.all([
    prisma.vehicle.findMany({
      where: { organizationId: user.organizationId, status: { not: "SOLD" } },
      include: { rooftop: true },
    }),
    prisma.appraisal.findMany({
      where: { organizationId: user.organizationId, status: { in: ["OFFERED", "DRAFT"] } },
      include: { rooftop: true },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    prisma.rooftop.findMany({ where: { organizationId: user.organizationId } }),
  ]);
  const target = rooftops[0]?.targetUnitsPerModel ?? 2;
  const aging = rooftops[0]?.agingThresholdDays ?? 45;
  const board = buildStockingBoard(
    vehicles.map((vehicle) => ({
      id: vehicle.id,
      make: vehicle.make,
      model: vehicle.model,
      segment: vehicle.segment,
      kind: vehicle.kind,
      daysInStock: daysInStock(vehicle.acquiredAt),
      status: vehicle.status,
    })),
    target,
    aging,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Stocking Board"
        description="What to buy and what’s overstocked by make, model, and segment. Live appraisal counters sit on the same desk."
      />
      <DemoBanner demo={user.demoMode} />
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Daily stocking</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-muted-foreground">
                <tr>
                  <th className="pb-2 font-medium">Bin</th>
                  <th className="pb-2 font-medium">On lot</th>
                  <th className="pb-2 font-medium">Target</th>
                  <th className="pb-2 font-medium">Need</th>
                  <th className="pb-2 font-medium">Aged</th>
                  <th className="pb-2 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {board.map((bin) => (
                  <tr key={bin.key} className="border-t">
                    <td className="py-2">
                      <p className="font-medium">
                        {bin.make} {bin.model}
                      </p>
                      <p className="text-xs text-muted-foreground">{bin.segment}</p>
                    </td>
                    <td>{bin.count}</td>
                    <td>{bin.target}</td>
                    <td>{bin.need > 0 ? `+${bin.need}` : bin.need}</td>
                    <td>{bin.agedCount}</td>
                    <td>
                      <StockingBadge action={bin.action} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Appraisal desk</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {appraisals.length === 0 ? (
              <p className="text-sm text-muted-foreground">No open appraisals.</p>
            ) : (
              appraisals.map((item) => (
                <Link key={item.id} href={`/app/appraisals/${item.id}`} className="block rounded-md border px-3 py-2">
                  <p className="font-medium">
                    {item.year} {item.make} {item.model}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Offer {item.offerCents ? `$${(item.offerCents / 100).toFixed(0)}` : "—"} · walk{" "}
                    {item.walkAwayCents ? `$${(item.walkAwayCents / 100).toFixed(0)}` : "—"}
                  </p>
                </Link>
              ))
            )}
            <Link href="/app/appraisals/new" className="text-sm font-medium underline">
              New live-market appraisal
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
