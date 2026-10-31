import { applySuggestedPrice } from "@/actions/inventory";
import { PageHeader } from "@/components/page-header";
import { DemoBanner } from "@/components/status-badges";
import { TurnScoreBadge } from "@/components/turn-score-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMoney } from "@/lib/money";
import { scoreOwnedVehicle } from "@/lib/turn-score";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/server/session";
import Link from "next/link";

export default async function TurnScorePage() {
  const user = await requireUser();
  const vehicles = await prisma.vehicle.findMany({
    where: { organizationId: user.organizationId, status: { not: "SOLD" }, kind: "USED" },
    include: { rooftop: true },
    orderBy: { acquiredAt: "asc" },
  });
  const rows = vehicles.map((vehicle) => ({
    vehicle,
    turn: scoreOwnedVehicle({
      marketRetailCents: vehicle.marketRetailCents,
      marketWholesaleCents: vehicle.marketWholesaleCents,
      costCents: vehicle.costCents,
      listPriceCents: vehicle.listPriceCents,
      acquiredAt: vehicle.acquiredAt,
      holdingCostPerDayCents: vehicle.holdingCostPerDayCents || vehicle.rooftop.holdingCostPerDayCents,
      reconSpendCents: vehicle.reconSpendCents,
      targetTurnDays: vehicle.rooftop.targetTurnDays,
    }),
  }));
  const counts = {
    hold: rows.filter((r) => r.turn.recommendation === "RETAIL_HOLD").length,
    down: rows.filter((r) => r.turn.recommendation === "PRICE_DOWN").length,
    soon: rows.filter((r) => r.turn.recommendation === "WHOLESALE_SOON").length,
    now: rows.filter((r) => r.turn.recommendation === "WHOLESALE_NOW").length,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Turn Score"
        description="Per-unit profit potential from CarsXE market value, cost, days, hold, recon, and supply/demand spread."
      />
      <DemoBanner demo={user.demoMode} />
      <div className="grid gap-4 sm:grid-cols-4">
        <Stat title="Retail — hold" value={counts.hold} />
        <Stat title="Price down" value={counts.down} />
        <Stat title="Wholesale soon" value={counts.soon} />
        <Stat title="Wholesale now" value={counts.now} />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Used units</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-muted-foreground">
              <tr>
                <th className="pb-2 font-medium">Unit</th>
                <th className="pb-2 font-medium">Score</th>
                <th className="pb-2 font-medium">All-in</th>
                <th className="pb-2 font-medium">Retail</th>
                <th className="pb-2 font-medium">Gross</th>
                <th className="pb-2 font-medium">Guidance</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ vehicle, turn }) => (
                <tr key={vehicle.id} className="border-t align-top">
                  <td className="py-3">
                    <Link className="font-medium hover:underline" href={`/app/inventory/${vehicle.id}`}>
                      {vehicle.year} {vehicle.make} {vehicle.model}
                    </Link>
                    <p className="text-xs text-muted-foreground">{vehicle.stockNumber}</p>
                  </td>
                  <td>
                    <TurnScoreBadge score={turn.score} recommendation={turn.recommendation} label={turn.label} />
                  </td>
                  <td>{formatMoney(turn.allInCostCents)}</td>
                  <td>{formatMoney(vehicle.marketRetailCents)}</td>
                  <td>{formatMoney(turn.expectedGrossCents)}</td>
                  <td className="max-w-sm">
                    <p>{turn.rationale[0]}</p>
                    {turn.suggestedListCents && turn.recommendation === "PRICE_DOWN" ? (
                      <form
                        action={async () => {
                          "use server";
                          await applySuggestedPrice(vehicle.id, turn.suggestedListCents!);
                        }}
                      >
                        <Button type="submit" size="sm" variant="outline" className="mt-2">
                          Apply {formatMoney(turn.suggestedListCents)}
                        </Button>
                      </form>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 ? <p className="text-sm text-muted-foreground">No used units on the lot.</p> : null}
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ title, value }: { title: string; value: number }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}
