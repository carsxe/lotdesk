import { createIncentiveAction, importIncentivesAction } from "@/actions/incentives";
import { PageHeader } from "@/components/page-header";
import { DemoBanner } from "@/components/status-badges";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatMoney } from "@/lib/money";
import { matchIncentives } from "@/lib/adapters/incentive";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/server/session";
import Link from "next/link";

export default async function NewLotPage() {
  const user = await requireUser();
  const [vehicles, programs] = await Promise.all([
    prisma.vehicle.findMany({
      where: { organizationId: user.organizationId, kind: "NEW", status: { not: "SOLD" } },
      include: { rooftop: true },
      orderBy: { year: "desc" },
    }),
    prisma.incentiveProgram.findMany({
      where: { organizationId: user.organizationId },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="New Lot"
        description="New-unit inventory with MSRP, invoice, and dealer-entered incentive programs. CarsXE has no incentives endpoint — programs are manual or importable through the adapter."
      />
      <DemoBanner demo={user.demoMode} />
      <Card>
        <CardHeader>
          <CardTitle>New inventory</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-muted-foreground">
              <tr>
                <th className="pb-2 font-medium">Unit</th>
                <th className="pb-2 font-medium">MSRP</th>
                <th className="pb-2 font-medium">Invoice</th>
                <th className="pb-2 font-medium">List</th>
                <th className="pb-2 font-medium">Programs</th>
              </tr>
            </thead>
            <tbody>
              {vehicles.map((vehicle) => {
                const hits = matchIncentives(
                  programs.map((p) => ({
                    name: p.name,
                    make: p.make,
                    model: p.model ?? undefined,
                    year: p.year ?? undefined,
                    amountCents: p.amountCents,
                    kind: p.kind,
                    source: p.source,
                  })),
                  { make: vehicle.make, model: vehicle.model, year: vehicle.year },
                );
                const incentiveTotal = hits.reduce((sum, item) => sum + item.amountCents, 0);
                return (
                  <tr key={vehicle.id} className="border-t">
                    <td className="py-2">
                      <Link className="font-medium hover:underline" href={`/app/inventory/${vehicle.id}`}>
                        {vehicle.year} {vehicle.make} {vehicle.model}
                      </Link>
                      <p className="text-xs text-muted-foreground">{vehicle.stockNumber}</p>
                    </td>
                    <td>{formatMoney(vehicle.msrpCents)}</td>
                    <td>{formatMoney(vehicle.invoiceCents)}</td>
                    <td>{formatMoney(vehicle.listPriceCents)}</td>
                    <td>
                      {hits.length === 0 ? (
                        "—"
                      ) : (
                        <span>
                          {hits.map((item) => item.name).join(", ")} · {formatMoney(incentiveTotal)}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {vehicles.length === 0 ? (
            <p className="text-sm text-muted-foreground">No new units. Add one with kind = New from inventory.</p>
          ) : null}
        </CardContent>
      </Card>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Add a program</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createIncentiveAction} className="grid gap-3 sm:grid-cols-2">
              <Field label="Name" name="name" placeholder="College grad rebate" />
              <Field label="Make" name="make" placeholder="Toyota" />
              <Field label="Model" name="model" placeholder="Camry" />
              <Field label="Year" name="year" placeholder="2025" />
              <Field label="Amount (USD)" name="amount" placeholder="500" />
              <div className="space-y-2">
                <Label htmlFor="kind">Kind</Label>
                <select id="kind" name="kind" className="h-9 w-full rounded-md border bg-background px-2 text-sm">
                  <option value="REBATE">Rebate</option>
                  <option value="BONUS">Bonus</option>
                  <option value="APR">APR</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <Button type="submit">Save program</Button>
              </div>
            </form>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Import programs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              CSV columns: name, make, model, year, amount, kind. Swap in an HTTP incentive adapter via{" "}
              <code>INCENTIVE_ADAPTER</code> when an OEM feed is available.
            </p>
            <form action={importIncentivesAction} className="flex flex-wrap items-end gap-2">
              <Input type="file" name="file" accept=".csv" />
              <Button type="submit" variant="outline">
                Import CSV
              </Button>
            </form>
            <ul className="text-sm">
              {programs.map((program) => (
                <li key={program.id}>
                  {program.name} · {program.make} {program.model ?? ""} · {formatMoney(program.amountCents)}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Field({ label, name, placeholder }: { label: string; name: string; placeholder?: string }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} placeholder={placeholder} />
    </div>
  );
}
