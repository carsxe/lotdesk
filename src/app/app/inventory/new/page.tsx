import { AddVehicleForm } from "@/app/app/inventory/new/add-form";
import { DemoBanner } from "@/components/status-badges";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getOrganization, requireUser } from "@/server/session";

export default async function NewInventoryPage() {
  const user = await requireUser();
  const org = await getOrganization(user.organizationId);
  const defaultRooftop = org.rooftops.find((item) => item.id === user.rooftopId) ?? org.rooftops[0];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Add a vehicle</h1>
        <p className="text-sm text-muted-foreground">
          Decodes the VIN and pulls CarsXE market value. Cached if this VIN was already looked up.
        </p>
      </div>
      <DemoBanner demo={org.demoMode} />
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>VIN intake</CardTitle>
        </CardHeader>
        <CardContent>
          <AddVehicleForm
            rooftops={org.rooftops}
            defaultRooftopId={defaultRooftop?.id ?? ""}
          />
        </CardContent>
      </Card>
    </div>
  );
}
