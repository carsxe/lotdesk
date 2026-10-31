import { applySuggestedPrice } from "@/actions/inventory";
import { PriceFlagBadge } from "@/components/status-badges";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatMoney, formatPercent } from "@/lib/money";
import { analyzePrice } from "@/lib/pricing";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/server/session";

export default async function PricingPage() {
  const user = await requireUser();
  const vehicles = await prisma.vehicle.findMany({
    where: { organizationId: user.organizationId, status: { in: ["FRONTLINE", "IN_RECON", "WHOLESALE"] } },
    include: { rooftop: true },
    orderBy: { acquiredAt: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Price to market</h1>
        <p className="text-sm text-muted-foreground">
          Asking price vs CarsXE retail clean. Suggestions haircut aged units after day 30.
        </p>
      </div>
      <Card>
        <CardContent className="overflow-x-auto pt-6">
          <table className="w-full text-sm">
            <thead className="text-left text-muted-foreground">
              <tr>
                <th className="pb-2 font-medium">Unit</th>
                <th className="pb-2 font-medium">Days</th>
                <th className="pb-2 font-medium">List</th>
                <th className="pb-2 font-medium">CarsXE retail</th>
                <th className="pb-2 font-medium">Delta</th>
                <th className="pb-2 font-medium">Suggested</th>
                <th className="pb-2 font-medium">Flag</th>
                <th className="pb-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {vehicles.map((vehicle) => {
                const analysis = analyzePrice({
                  listCents: vehicle.listPriceCents,
                  marketRetailCents: vehicle.marketRetailCents,
                  acquiredAt: vehicle.acquiredAt,
                  agingThresholdDays: vehicle.rooftop.agingThresholdDays,
                });
                return (
                  <tr key={vehicle.id} className="border-t">
                    <td className="py-3">
                      <p className="font-medium">
                        {vehicle.year} {vehicle.make} {vehicle.model}
                      </p>
                      <p className="text-xs text-muted-foreground">{vehicle.stockNumber}</p>
                    </td>
                    <td>{analysis.daysInStock}</td>
                    <td>{formatMoney(vehicle.listPriceCents)}</td>
                    <td>{formatMoney(vehicle.marketRetailCents)}</td>
                    <td>
                      {formatMoney(analysis.deltaCents)}{" "}
                      <span className="text-muted-foreground">{formatPercent(analysis.pct)}</span>
                    </td>
                    <td>{formatMoney(analysis.suggestedListCents)}</td>
                    <td>
                      <PriceFlagBadge flag={analysis.flag} aging={analysis.aging} />
                    </td>
                    <td>
                      {analysis.suggestedListCents != null &&
                      analysis.suggestedListCents !== vehicle.listPriceCents ? (
                        <form
                          action={async () => {
                            "use server";
                            await applySuggestedPrice(vehicle.id, analysis.suggestedListCents!);
                          }}
                        >
                          <Button type="submit" size="sm" variant="outline">
                            Apply
                          </Button>
                        </form>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
