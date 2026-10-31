import { addSpinFramesAction } from "@/actions/merch";
import { BetaBanner } from "@/components/beta-banner";
import { PageHeader } from "@/components/page-header";
import { SpinViewer } from "@/components/spin-viewer";
import { DemoBanner } from "@/components/status-badges";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAppUrl } from "@/lib/env";
import { isFlagOn } from "@/lib/flags";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/server/session";

export default async function SpinPage() {
  const user = await requireUser();
  const flags = await prisma.featureFlag.findMany({ where: { organizationId: user.organizationId } });
  if (!isFlagOn(flags, "spin-view")) {
    return <PageHeader title="Spin View" description="This Lab feature is off for the group." />;
  }
  const vehicles = await prisma.vehicle.findMany({
    where: { organizationId: user.organizationId, status: { not: "SOLD" } },
    include: { spinFrames: true },
    orderBy: { acquiredAt: "desc" },
  });
  vehicles.sort((a, b) => b.spinFrames.length - a.spinFrames.length);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Spin View"
        description="Interactive 360 merchandising from a photo sequence. Embed the public player on a dealer site."
      />
      <DemoBanner demo={user.demoMode} />
      <BetaBanner flagKey="spin-view" name="Spin View" />
      <div className="grid gap-4 lg:grid-cols-2">
        {vehicles.map((vehicle) => (
          <Card key={vehicle.id}>
            <CardHeader>
              <CardTitle>
                {vehicle.year} {vehicle.make} {vehicle.model}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <SpinViewer
                frames={vehicle.spinFrames}
                label={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
              />
              <form action={addSpinFramesAction}>
                <input type="hidden" name="vehicleId" value={vehicle.id} />
                <Button type="submit" variant="outline">
                  Generate demo sequence
                </Button>
              </form>
              {vehicle.spinFrames.length > 0 ? (
                <p className="text-xs text-muted-foreground">
                  Embed: <code>{getAppUrl()}/embed/spin/{vehicle.id}</code>
                </p>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
