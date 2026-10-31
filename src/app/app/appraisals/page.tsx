import { AppraisalStatusBadge } from "@/components/status-badges";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { formatMoney } from "@/lib/money";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/server/session";
import Link from "next/link";

export default async function AppraisalsPage() {
  const user = await requireUser();
  const rows = await prisma.appraisal.findMany({
    where: { organizationId: user.organizationId },
    include: { rooftop: true, appraiser: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Appraisal desk</h1>
          <p className="text-sm text-muted-foreground">
            Trade-ins and buys. Each lookup is a CarsXE pack: specs, value, history, recalls.
          </p>
        </div>
        <Link href="/app/appraisals/new" className={cn(buttonVariants())}>
          New appraisal
        </Link>
      </div>
      <Card>
        <CardContent className="overflow-x-auto pt-6">
          {rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">No appraisals yet. Start with a VIN or plate.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-left text-muted-foreground">
                <tr>
                  <th className="pb-2 font-medium">Vehicle</th>
                  <th className="pb-2 font-medium">Customer</th>
                  <th className="pb-2 font-medium">Offer</th>
                  <th className="pb-2 font-medium">Market retail</th>
                  <th className="pb-2 font-medium">Flags</th>
                  <th className="pb-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-t">
                    <td className="py-3">
                      <Link className="font-medium hover:underline" href={`/app/appraisals/${row.id}`}>
                        {row.year} {row.make} {row.model}
                      </Link>
                      <p className="font-mono text-xs text-muted-foreground">{row.vin}</p>
                    </td>
                    <td>
                      {row.customerName ?? "—"}
                      <p className="text-xs text-muted-foreground">{row.rooftop.name}</p>
                    </td>
                    <td>{formatMoney(row.offerCents)}</td>
                    <td>{formatMoney(row.marketRetailCents)}</td>
                    <td className="text-xs">
                      {row.hasOpenLien || row.hasTheftFlag || row.brandCount || row.recallCount
                        ? [
                            row.brandCount ? `${row.brandCount} brands` : null,
                            row.recallCount ? `${row.recallCount} recalls` : null,
                            row.hasOpenLien ? "lien" : null,
                            row.hasTheftFlag ? "theft" : null,
                          ]
                            .filter(Boolean)
                            .join(" · ")
                        : "Clean"}
                    </td>
                    <td>
                      <AppraisalStatusBadge status={row.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
