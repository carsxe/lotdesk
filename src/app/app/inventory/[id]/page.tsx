import { refreshVehicleMarket, updateVehicleAction } from "@/actions/inventory";
import { PriceFlagBadge, ReconBadge, VehicleStatusBadge } from "@/components/status-badges";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getFixtureVin } from "@/lib/carsxe/fixtures";
import { formatMoney, formatNumber } from "@/lib/money";
import { analyzePrice } from "@/lib/pricing";
import { prisma } from "@/lib/prisma";
import { getOrganization, requireUser } from "@/server/session";
import { notFound } from "next/navigation";
import { SpecSheet } from "@/components/spec-sheet";

export default async function VehicleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const org = await getOrganization(user.organizationId);
  const { id } = await params;
  const vehicle = await prisma.vehicle.findFirst({
    where: { id, organizationId: user.organizationId },
    include: { rooftop: true },
  });
  if (!vehicle) notFound();

  const analysis = analyzePrice({
    listCents: vehicle.listPriceCents,
    marketRetailCents: vehicle.marketRetailCents,
    acquiredAt: vehicle.acquiredAt,
    agingThresholdDays: vehicle.rooftop.agingThresholdDays,
  });
  const fixture = getFixtureVin(vehicle.vin);
  const image = fixture?.images.images[0]?.link;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-xs text-muted-foreground">{vehicle.stockNumber}</p>
          <h1 className="text-2xl font-semibold">
            {vehicle.year} {vehicle.make} {vehicle.model} {vehicle.trim}
          </h1>
          <p className="font-mono text-sm text-muted-foreground">{vehicle.vin}</p>
        </div>
        <div className="flex items-center gap-2">
          <VehicleStatusBadge status={vehicle.status} />
          <ReconBadge stage={vehicle.reconStage} />
          <PriceFlagBadge flag={analysis.flag} aging={analysis.aging} />
        </div>
      </div>

      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt="" className="h-64 w-full rounded-xl border object-cover" />
      ) : null}

      <div className="grid gap-4 md:grid-cols-4">
        <Stat label="Days in stock" value={String(analysis.daysInStock)} />
        <Stat label="Cost" value={formatMoney(vehicle.costCents)} />
        <Stat label="List" value={formatMoney(vehicle.listPriceCents)} />
        <Stat label="CarsXE retail" value={formatMoney(vehicle.marketRetailCents)} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Update unit</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={updateVehicleAction} className="grid gap-4 sm:grid-cols-2">
              <input type="hidden" name="id" value={vehicle.id} />
              <Field label="Stock #" name="stockNumber" defaultValue={vehicle.stockNumber} />
              <Field label="Mileage" name="mileage" defaultValue={String(vehicle.mileage)} />
              <Field label="Cost (USD)" name="cost" defaultValue={String(vehicle.costCents / 100)} />
              <Field
                label="List (USD)"
                name="listPrice"
                defaultValue={String(vehicle.listPriceCents / 100)}
              />
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  name="status"
                  defaultValue={vehicle.status}
                  className="h-9 w-full rounded-md border bg-background px-2 text-sm"
                >
                  <option value="IN_RECON">Recon</option>
                  <option value="FRONTLINE">Frontline</option>
                  <option value="WHOLESALE">Wholesale</option>
                  <option value="PENDING">Pending</option>
                  <option value="SOLD">Sold</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reconStage">Recon stage</Label>
                <select
                  id="reconStage"
                  name="reconStage"
                  defaultValue={vehicle.reconStage}
                  className="h-9 w-full rounded-md border bg-background px-2 text-sm"
                >
                  <option value="INTAKE">Intake</option>
                  <option value="MECHANICAL">Mechanical</option>
                  <option value="BODY">Body</option>
                  <option value="DETAIL">Detail</option>
                  <option value="PHOTOS">Photos</option>
                  <option value="READY">Ready</option>
                </select>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="rooftopId">Rooftop</Label>
                <select
                  id="rooftopId"
                  name="rooftopId"
                  defaultValue={vehicle.rooftopId}
                  className="h-9 w-full rounded-md border bg-background px-2 text-sm"
                >
                  {org.rooftops.map((rooftop) => (
                    <option key={rooftop.id} value={rooftop.id}>
                      {rooftop.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" name="notes" defaultValue={vehicle.notes ?? ""} />
              </div>
              <Button type="submit">Save</Button>
            </form>
            <form
              action={async () => {
                "use server";
                await refreshVehicleMarket(id);
              }}
              className="mt-3"
            >
              <Button type="submit" variant="outline">
                Refresh CarsXE market
              </Button>
            </form>
          </CardContent>
        </Card>
        <SpecSheet
          year={vehicle.year}
          make={vehicle.make}
          model={vehicle.model}
          trim={vehicle.trim}
          vin={vehicle.vin}
          color={vehicle.color}
          bodyStyle={vehicle.bodyStyle}
          mileage={vehicle.mileage}
          listPriceCents={vehicle.listPriceCents}
          stockNumber={vehicle.stockNumber}
          rooftop={vehicle.rooftop.name}
          equipment={fixture?.specs.equipment}
          warranties={fixture?.specs.warranties}
          attributes={fixture?.specs.attributes}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        Mileage {formatNumber(vehicle.mileage)} · Suggested list {formatMoney(analysis.suggestedListCents)}
      </p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}

function Field({
  label,
  name,
  defaultValue,
}: {
  label: string;
  name: string;
  defaultValue: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} defaultValue={defaultValue} />
    </div>
  );
}
