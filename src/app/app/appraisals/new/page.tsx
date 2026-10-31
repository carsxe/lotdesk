import { DeskForm } from "@/app/app/appraisals/new/desk-form";
import { DemoBanner } from "@/components/status-badges";
import { getOrganization, requireUser } from "@/server/session";

export default async function NewAppraisalPage() {
  const user = await requireUser();
  const org = await getOrganization(user.organizationId);
  const defaultRooftop = org.rooftops.find((item) => item.id === user.rooftopId) ?? org.rooftops[0];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">New appraisal</h1>
        <p className="text-sm text-muted-foreground">
          This action spends CarsXE specs, market value, history (with lien/theft), recalls, and images
          unless a matching cache entry exists.
        </p>
      </div>
      <DemoBanner demo={org.demoMode} />
      <DeskForm
        rooftops={org.rooftops}
        defaultRooftopId={defaultRooftop?.id ?? ""}
        defaultState={defaultRooftop?.state ?? "OR"}
      />
    </div>
  );
}
