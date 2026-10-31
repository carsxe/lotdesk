import { generateDescriptionAction } from "@/actions/merch";
import { runAssistantAction } from "@/actions/assistant";
import { BetaBanner } from "@/components/beta-banner";
import { PageHeader } from "@/components/page-header";
import { DemoBanner } from "@/components/status-badges";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMoney } from "@/lib/money";
import { isFlagOn } from "@/lib/flags";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/server/session";
import { AssistantForm } from "./assistant-form";
import Link from "next/link";

export default async function AssistantPage() {
  const user = await requireUser();
  const flags = await prisma.featureFlag.findMany({ where: { organizationId: user.organizationId } });
  if (!isFlagOn(flags, "lot-assistant")) {
    return <PageHeader title="Lot Assistant" description="This Lab feature is off for the group." />;
  }
  const vehicles = await prisma.vehicle.findMany({
    where: { organizationId: user.organizationId, status: { not: "SOLD" }, kind: "USED" },
    orderBy: { listPriceCents: "desc" },
    take: 8,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Lot Assistant"
        description="AI descriptions from CarsXE specs and an in-app assistant for routine inventory work. Demo planner runs without keys."
      />
      <DemoBanner demo={user.demoMode} />
      <BetaBanner flagKey="lot-assistant" name="Lot Assistant" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Ask the lot</CardTitle>
          </CardHeader>
          <CardContent>
            <AssistantForm action={runAssistantAction} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Cross-shop</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {vehicles.map((vehicle) => (
              <div key={vehicle.id} className="flex items-center justify-between gap-2 rounded-md border px-3 py-2">
                <Link href={`/app/inventory/${vehicle.id}`} className="font-medium hover:underline">
                  {vehicle.year} {vehicle.make} {vehicle.model}
                </Link>
                <span>
                  {formatMoney(vehicle.listPriceCents)} · mkt {formatMoney(vehicle.marketRetailCents)}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Write descriptions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {vehicles.map((vehicle) => (
            <div key={vehicle.id} className="rounded-md border px-3 py-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium">
                  {vehicle.year} {vehicle.make} {vehicle.model}
                </p>
                <form action={generateDescriptionAction}>
                  <input type="hidden" name="vehicleId" value={vehicle.id} />
                  <Button type="submit" size="sm" variant="outline">
                    Generate
                  </Button>
                </form>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {vehicle.aiDescription ?? vehicle.description ?? "No description yet."}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
