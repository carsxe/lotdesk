import { DemoBanner } from "@/components/status-badges";
import { AppraisalStatusBadge, PriceFlagBadge, VehicleStatusBadge } from "@/components/status-badges";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMoney, formatNumber } from "@/lib/money";
import { dashboardMetrics } from "@/server/queries";
import { requireUser } from "@/server/session";
import Link from "next/link";

export default async function DashboardPage() {
  const user = await requireUser();
  const metrics = await dashboardMetrics(user.organizationId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Lot health</h1>
        <p className="text-sm text-muted-foreground">
          {user.organizationName} · {metrics.inStock} units on the ground
        </p>
      </div>
      <DemoBanner demo={user.demoMode} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric title="In stock" value={formatNumber(metrics.inStock)} hint={`${metrics.recon} in recon`} />
        <Metric title="Average days" value={String(metrics.avgDays)} hint={`${metrics.aged} aged units`} />
        <Metric title="Over / under market" value={`${metrics.over} / ${metrics.under}`} hint="vs CarsXE retail clean" />
        <Metric
          title="CarsXE calls this month"
          value={String(metrics.usage.total)}
          hint={`${metrics.usage.billed} billed · ${metrics.usage.cached} cached`}
        />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Investment vs asking</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">Floor / cost</p>
              <p className="text-2xl font-semibold">{formatMoney(metrics.investment)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">List prices</p>
              <p className="text-2xl font-semibold">{formatMoney(metrics.asking)}</p>
            </div>
            <div className="sm:col-span-2">
              <p className="mb-2 text-sm font-medium">Recon pipeline</p>
              <div className="grid grid-cols-3 gap-2 text-sm md:grid-cols-6">
                {Object.entries(metrics.reconCounts).map(([stage, count]) => (
                  <div key={stage} className="rounded-md border px-2 py-2">
                    <p className="text-xs text-muted-foreground">{stage}</p>
                    <p className="text-lg font-semibold">{count}</p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Recent appraisals</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {metrics.appraisals.length === 0 ? (
              <p className="text-sm text-muted-foreground">No appraisals yet.</p>
            ) : (
              metrics.appraisals.map((item) => (
                <Link
                  key={item.id}
                  href={`/app/appraisals/${item.id}`}
                  className="block rounded-md border px-3 py-2 hover:bg-muted/50"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium">
                      {item.year} {item.make} {item.model}
                    </p>
                    <AppraisalStatusBadge status={item.status} />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {item.customerName ?? "No customer"} · {item.rooftop.name}
                  </p>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Watch list</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-muted-foreground">
              <tr>
                <th className="pb-2 font-medium">Unit</th>
                <th className="pb-2 font-medium">Days</th>
                <th className="pb-2 font-medium">List</th>
                <th className="pb-2 font-medium">CarsXE</th>
                <th className="pb-2 font-medium">Flag</th>
                <th className="pb-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {metrics.vehicles
                .filter((row) => row.analysis.aging || row.analysis.flag !== "in-market")
                .slice(0, 8)
                .map(({ vehicle, analysis }) => (
                  <tr key={vehicle.id} className="border-t">
                    <td className="py-2">
                      <Link className="font-medium hover:underline" href={`/app/inventory/${vehicle.id}`}>
                        {vehicle.year} {vehicle.make} {vehicle.model}
                      </Link>
                      <p className="text-xs text-muted-foreground">{vehicle.stockNumber}</p>
                    </td>
                    <td>{analysis.daysInStock}</td>
                    <td>{formatMoney(vehicle.listPriceCents)}</td>
                    <td>{formatMoney(vehicle.marketRetailCents)}</td>
                    <td>
                      <PriceFlagBadge flag={analysis.flag} aging={analysis.aging} />
                    </td>
                    <td>
                      <VehicleStatusBadge status={vehicle.status} />
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
          {metrics.vehicles.every((row) => !row.analysis.aging && row.analysis.flag === "in-market") ? (
            <p className="text-sm text-muted-foreground">No aged or off-market units right now.</p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

function Metric({ title, value, hint }: { title: string; value: string; hint: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold">{value}</p>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  );
}
