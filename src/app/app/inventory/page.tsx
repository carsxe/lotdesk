import { PriceFlagBadge, ReconBadge, VehicleStatusBadge } from "@/components/status-badges";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { formatMoney } from "@/lib/money";
import { analyzePrice } from "@/lib/pricing";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/server/session";
import Link from "next/link";

export default async function InventoryPage() {
  const user = await requireUser();
  const vehicles = await prisma.vehicle.findMany({
    where: { organizationId: user.organizationId },
    include: { rooftop: true },
    orderBy: { acquiredAt: "asc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Inventory</h1>
          <p className="text-sm text-muted-foreground">
            {vehicles.length} units · aging from acquired date · prices vs CarsXE retail
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/app/inventory/import" className={cn(buttonVariants({ variant: "outline" }))}>
            CSV import
          </Link>
          <Link href="/app/inventory/new" className={cn(buttonVariants())}>
            Add VIN
          </Link>
        </div>
      </div>
      <Card>
        <CardContent className="overflow-x-auto pt-6">
          {vehicles.length === 0 ? (
            <p className="text-sm text-muted-foreground">No vehicles on the ground.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-left text-muted-foreground">
                <tr>
                  <th className="pb-2 font-medium">Stock</th>
                  <th className="pb-2 font-medium">Vehicle</th>
                  <th className="pb-2 font-medium">Rooftop</th>
                  <th className="pb-2 font-medium">Days</th>
                  <th className="pb-2 font-medium">Cost</th>
                  <th className="pb-2 font-medium">List</th>
                  <th className="pb-2 font-medium">Market</th>
                  <th className="pb-2 font-medium">Flag</th>
                  <th className="pb-2 font-medium">Status</th>
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
                      <td className="py-3 font-mono text-xs">{vehicle.stockNumber}</td>
                      <td>
                        <Link className="font-medium hover:underline" href={`/app/inventory/${vehicle.id}`}>
                          {vehicle.year} {vehicle.make} {vehicle.model}
                        </Link>
                        <p className="text-xs text-muted-foreground">{vehicle.trim}</p>
                      </td>
                      <td>{vehicle.rooftop.name}</td>
                      <td>{analysis.daysInStock}</td>
                      <td>{formatMoney(vehicle.costCents)}</td>
                      <td>{formatMoney(vehicle.listPriceCents)}</td>
                      <td>{formatMoney(vehicle.marketRetailCents)}</td>
                      <td>
                        <PriceFlagBadge flag={analysis.flag} aging={analysis.aging} />
                      </td>
                      <td className="space-x-1">
                        <VehicleStatusBadge status={vehicle.status} />
                        {vehicle.status === "IN_RECON" ? <ReconBadge stage={vehicle.reconStage} /> : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
