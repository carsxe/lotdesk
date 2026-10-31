import { importSourcingAction, stockSourcingCandidateAction } from "@/actions/sourcing";
import { PageHeader } from "@/components/page-header";
import { DemoBanner } from "@/components/status-badges";
import { StockingBadge, TurnScoreBadge } from "@/components/turn-score-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { scoreSourcingCandidate } from "@/lib/adapters/source";
import { formatMoney } from "@/lib/money";
import { daysInStock } from "@/lib/pricing";
import { binKey, buildStockingBoard } from "@/lib/stocking";
import { prisma } from "@/lib/prisma";
import { getOrganization, requireUser } from "@/server/session";
import { getFixtureVin } from "@/lib/carsxe/fixtures";
import { adjustedBandValue } from "@/lib/carsxe/types";

export default async function SourcingPage() {
  const user = await requireUser();
  const org = await getOrganization(user.organizationId);
  const [candidates, vehicles] = await Promise.all([
    prisma.sourcingCandidate.findMany({
      where: { organizationId: user.organizationId },
      orderBy: { createdAt: "desc" },
    }),
    prisma.vehicle.findMany({
      where: { organizationId: user.organizationId, status: { not: "SOLD" } },
    }),
  ]);
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
    org.rooftops[0]?.targetUnitsPerModel ?? 2,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sourcing"
        description="Wholesale and retail candidates from CSV/feed adapters, scored against Turn Score and the Stocking Board."
      />
      <DemoBanner demo={user.demoMode} />
      <Card>
        <CardHeader>
          <CardTitle>Import a feed</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={importSourcingAction} className="flex flex-wrap items-end gap-2">
            <Input type="file" name="file" accept=".csv" />
            <Button type="submit">Import CSV</Button>
          </form>
          <p className="mt-2 text-xs text-muted-foreground">
            Columns: vin, year, make, model, trim, mileage, asking, source. Plug in another adapter with{" "}
            <code>SOURCE_ADAPTER</code>.
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Candidates</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-muted-foreground">
              <tr>
                <th className="pb-2 font-medium">Unit</th>
                <th className="pb-2 font-medium">Ask</th>
                <th className="pb-2 font-medium">Fit</th>
                <th className="pb-2 font-medium">Stocking</th>
                <th className="pb-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {candidates.map((row) => {
                const fixture = getFixtureVin(row.vin);
                const retail = fixture
                  ? Math.round((adjustedBandValue(fixture.marketValue.retail_clean, "retail_clean") ?? 0) * 100)
                  : null;
                const wholesale = fixture
                  ? Math.round((adjustedBandValue(fixture.marketValue.whole_clean, "whole_clean") ?? 0) * 100)
                  : null;
                const bin = board.find((item) => item.key === binKey(row.make, row.model, row.segment));
                const scored = scoreSourcingCandidate({
                  askingCents: row.askingCents,
                  marketRetailCents: retail,
                  marketWholesaleCents: wholesale,
                  binNeed: bin?.need,
                });
                return (
                  <tr key={row.id} className="border-t align-top">
                    <td className="py-2">
                      <p className="font-medium">
                        {row.year} {row.make} {row.model}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {row.sourceName} · {row.adapter}
                      </p>
                    </td>
                    <td>{formatMoney(row.askingCents)}</td>
                    <td>
                      <TurnScoreBadge
                        score={scored.turn.score}
                        recommendation={scored.recommendation}
                        label={scored.fit === "pass" ? "Pass" : scored.turn.label}
                      />
                    </td>
                    <td>{bin ? <StockingBadge action={bin.action} /> : "New bin"}</td>
                    <td>
                      <form action={stockSourcingCandidateAction}>
                        <input type="hidden" name="id" value={row.id} />
                        <input type="hidden" name="rooftopId" value={org.rooftops[0]?.id ?? ""} />
                        <Button type="submit" size="sm" variant="outline" disabled={scored.fit === "pass"}>
                          Stock
                        </Button>
                      </form>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {candidates.length === 0 ? (
            <p className="text-sm text-muted-foreground">No candidates. Import a lane or marketplace CSV.</p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
