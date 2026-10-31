import { createInspectionAction } from "@/actions/condition";
import { BetaBanner } from "@/components/beta-banner";
import { ConditionTagger } from "@/components/condition-tagger";
import { PageHeader } from "@/components/page-header";
import { DemoBanner } from "@/components/status-badges";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { isFlagOn } from "@/lib/flags";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/server/session";

export default async function ConditionPage() {
  const user = await requireUser();
  const flags = await prisma.featureFlag.findMany({ where: { organizationId: user.organizationId } });
  if (!isFlagOn(flags, "condition-book")) {
    return <PageHeader title="Condition Book" description="This Lab feature is off for the group." />;
  }
  const [inspections, appraisals] = await Promise.all([
    prisma.inspection.findMany({
      where: { organizationId: user.organizationId },
      include: { tags: true, appraisal: true, vehicle: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.appraisal.findMany({
      where: { organizationId: user.organizationId },
      orderBy: { createdAt: "desc" },
      take: 12,
    }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Condition Book"
        description="Attach exterior inspection imagery to appraisals. Manual tagging works out of the box; INSPECTION_PROVIDER can call a hosted model later."
      />
      <DemoBanner demo={user.demoMode} />
      <BetaBanner flagKey="condition-book" name="Condition Book" />
      <Card>
        <CardHeader>
          <CardTitle>New inspection</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createInspectionAction} className="grid gap-3 md:grid-cols-4">
            <select name="appraisalId" className="h-9 rounded-md border bg-background px-2 text-sm">
              <option value="">Appraisal (optional)</option>
              {appraisals.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.year} {item.make} {item.model} · {item.vin.slice(-6)}
                </option>
              ))}
            </select>
            <Input name="imageUrl" placeholder="Image URL (demo if empty)" />
            <select name="grade" defaultValue="CLEAN" className="h-9 rounded-md border bg-background px-2 text-sm">
              <option value="EXCELLENT">Excellent</option>
              <option value="CLEAN">Clean</option>
              <option value="AVERAGE">Average</option>
              <option value="ROUGH">Rough</option>
            </select>
            <Button type="submit">Attach imagery</Button>
          </form>
        </CardContent>
      </Card>
      <div className="grid gap-4 lg:grid-cols-2">
        {inspections.map((inspection) => (
          <Card key={inspection.id}>
            <CardHeader>
              <CardTitle>
                Grade {inspection.grade}
                {inspection.appraisal
                  ? ` · ${inspection.appraisal.year} ${inspection.appraisal.make} ${inspection.appraisal.model}`
                  : ""}
              </CardTitle>
              <p className="text-xs text-muted-foreground">Provider {inspection.provider}</p>
            </CardHeader>
            <CardContent>
              <ConditionTagger
                inspectionId={inspection.id}
                imageUrl={inspection.imageUrl ?? "/api/demo-image?make=Inspection&model=Exterior"}
                tags={inspection.tags}
              />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
