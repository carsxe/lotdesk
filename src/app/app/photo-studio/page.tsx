import { attachPhotoAction, restylePhotoAction } from "@/actions/merch";
import { PageHeader } from "@/components/page-header";
import { DemoBanner } from "@/components/status-badges";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/server/session";

export default async function PhotoStudioPage() {
  const user = await requireUser();
  const vehicles = await prisma.vehicle.findMany({
    where: { organizationId: user.organizationId, status: { not: "SOLD" } },
    include: { photos: { orderBy: { createdAt: "desc" } } },
    orderBy: { acquiredAt: "desc" },
  });
  vehicles.sort((a, b) => b.photos.length - a.photos.length);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Photo Studio"
        description="Upload per unit, then apply a consistent studio background. Demo mode uses a local restyle; point IMAGE_PROVIDER at a hosted cutter later."
      />
      <DemoBanner demo={user.demoMode} />
      <div className="grid gap-4 md:grid-cols-2">
        {vehicles.map((vehicle) => {
          const raw = vehicle.photos.find((p) => p.kind === "RAW");
          const cut = vehicle.photos.find((p) => p.kind === "CUTOUT");
          return (
            <Card key={vehicle.id}>
              <CardHeader>
                <CardTitle>
                  {vehicle.year} {vehicle.make} {vehicle.model}
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  {vehicle.stockNumber} · {vehicle.photoPackReady ? "Pack ready" : "Needs studio pack"}
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <Shot label="Raw" url={raw?.url} />
                  <Shot label="Studio" url={cut?.url} />
                </div>
                <form action={attachPhotoAction} className="flex gap-2">
                  <input type="hidden" name="vehicleId" value={vehicle.id} />
                  <Input name="url" placeholder="Photo URL (optional — demo placeholder if empty)" />
                  <Button type="submit" variant="outline">
                    Attach
                  </Button>
                </form>
                <form action={restylePhotoAction}>
                  <input type="hidden" name="vehicleId" value={vehicle.id} />
                  <input type="hidden" name="mode" value="studio" />
                  <Button type="submit">Apply studio background</Button>
                </form>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function Shot({ label, url }: { label: string; url?: string }) {
  return (
    <div>
      <p className="mb-1 text-xs text-muted-foreground">{label}</p>
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={label} className="h-36 w-full rounded-md border object-cover" />
      ) : (
        <div className="flex h-36 items-center justify-center rounded-md border text-xs text-muted-foreground">
          None
        </div>
      )}
    </div>
  );
}
