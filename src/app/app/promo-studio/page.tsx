import { restylePhotoAction } from "@/actions/merch";
import { BetaBanner } from "@/components/beta-banner";
import { PageHeader } from "@/components/page-header";
import { DemoBanner } from "@/components/status-badges";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { isFlagOn } from "@/lib/flags";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/server/session";

export default async function PromoStudioPage() {
  const user = await requireUser();
  const flags = await prisma.featureFlag.findMany({ where: { organizationId: user.organizationId } });
  if (!isFlagOn(flags, "promo-studio")) {
    return (
      <div className="space-y-4">
        <PageHeader title="Promo Studio" description="This Lab feature is off for the group." />
      </div>
    );
  }
  const vehicles = await prisma.vehicle.findMany({
    where: { organizationId: user.organizationId, status: { not: "SOLD" } },
    include: { photos: { where: { kind: { in: ["PROMO", "CUTOUT", "RAW"] } }, orderBy: { createdAt: "desc" } } },
    orderBy: [{ certified: "desc" }, { acquiredAt: "desc" }],
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Promo Studio"
        description="Overlay CPO, warranty, and feature callouts on studio photos. Templates are dealer-configurable."
      />
      <DemoBanner demo={user.demoMode} />
      <BetaBanner flagKey="promo-studio" name="Promo Studio" />
      <div className="grid gap-4 md:grid-cols-2">
        {vehicles.map((vehicle) => {
          const promo = vehicle.photos.find((p) => p.kind === "PROMO");
          return (
            <Card key={vehicle.id}>
              <CardHeader>
                <CardTitle>
                  {vehicle.year} {vehicle.make} {vehicle.model}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {promo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={promo.url} alt="" className="h-44 w-full rounded-md border object-cover" />
                ) : (
                  <div className="flex h-44 items-center justify-center rounded-md border text-sm text-muted-foreground">
                    No promo frame yet
                  </div>
                )}
                <form action={restylePhotoAction} className="grid gap-2 sm:grid-cols-3">
                  <input type="hidden" name="vehicleId" value={vehicle.id} />
                  <input type="hidden" name="mode" value="promo" />
                  <select name="overlay" className="h-9 rounded-md border bg-background px-2 text-sm">
                    <option value="cpo">CPO billboard</option>
                    <option value="warranty">Warranty</option>
                    <option value="feature">Feature callout</option>
                  </select>
                  <Input name="feature" placeholder="One-owner · CarPlay" />
                  <Button type="submit">Apply overlay</Button>
                </form>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
