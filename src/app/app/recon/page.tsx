import { addReconLineAction, advanceReconStageAction, decideReconLineAction } from "@/actions/recon";
import { PageHeader } from "@/components/page-header";
import { DemoBanner, ReconBadge } from "@/components/status-badges";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatMoney } from "@/lib/money";
import { daysInStock } from "@/lib/pricing";
import { canDecideRecon, holdingCostCents, hoursInStep, pendingReconCents } from "@/lib/recon";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/server/session";
import Link from "next/link";

export default async function ReconPage() {
  const user = await requireUser();
  const vehicles = await prisma.vehicle.findMany({
    where: { organizationId: user.organizationId, status: { not: "SOLD" } },
    include: { rooftop: true, reconLines: { include: { approvedBy: true }, orderBy: { createdAt: "desc" } } },
    orderBy: { acquiredAt: "asc" },
  });
  const inRecon = vehicles.filter((v) => v.status === "IN_RECON" || v.reconLines.some((l) => l.status === "PENDING"));
  const hold = vehicles.reduce(
    (sum, v) =>
      sum +
      holdingCostCents({
        daysInStock: daysInStock(v.acquiredAt),
        holdingCostPerDayCents: v.holdingCostPerDayCents || v.rooftop.holdingCostPerDayCents,
        reconSpendCents: v.reconSpendCents,
      }),
    0,
  );
  const pending = vehicles.reduce((sum, v) => sum + pendingReconCents(v.reconLines), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Recon Board"
        description="Line-item estimates, role-based approvals, vendor assignment, time-in-step, and holding cost."
      />
      <DemoBanner demo={user.demoMode} />
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Units in recon</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{inRecon.length}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Hold + approved recon</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{formatMoney(hold)}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Pending approvals</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{formatMoney(pending)}</CardContent>
        </Card>
      </div>
      {inRecon.map((vehicle) => (
        <Card key={vehicle.id}>
          <CardHeader className="flex flex-row items-start justify-between">
            <div>
              <CardTitle>
                <Link href={`/app/inventory/${vehicle.id}`} className="hover:underline">
                  {vehicle.year} {vehicle.make} {vehicle.model}
                </Link>
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                {vehicle.stockNumber} · {hoursInStep(vehicle.stageEnteredAt ?? vehicle.acquiredAt)}h in step · hold{" "}
                {formatMoney(
                  holdingCostCents({
                    daysInStock: daysInStock(vehicle.acquiredAt),
                    holdingCostPerDayCents: vehicle.holdingCostPerDayCents || vehicle.rooftop.holdingCostPerDayCents,
                    reconSpendCents: vehicle.reconSpendCents,
                  }),
                )}
              </p>
            </div>
            <ReconBadge stage={vehicle.reconStage} />
          </CardHeader>
          <CardContent className="space-y-4">
            <table className="w-full text-sm">
              <thead className="text-left text-muted-foreground">
                <tr>
                  <th className="pb-2 font-medium">Line</th>
                  <th className="pb-2 font-medium">Vendor</th>
                  <th className="pb-2 font-medium">Estimate</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {vehicle.reconLines.map((line) => (
                  <tr key={line.id} className="border-t">
                    <td className="py-2">
                      <p className="font-medium">{line.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {line.category} · {line.stage}
                      </p>
                    </td>
                    <td>{line.vendor ?? "—"}</td>
                    <td>{formatMoney(line.estimateCents)}</td>
                    <td className="capitalize">{line.status.toLowerCase()}</td>
                    <td>
                      {line.status === "PENDING" && canDecideRecon(user.role) ? (
                        <div className="flex gap-1">
                          <form action={decideReconLineAction}>
                            <input type="hidden" name="id" value={line.id} />
                            <input type="hidden" name="decision" value="APPROVED" />
                            <Button size="sm" type="submit">
                              Approve
                            </Button>
                          </form>
                          <form action={decideReconLineAction}>
                            <input type="hidden" name="id" value={line.id} />
                            <input type="hidden" name="decision" value="DECLINED" />
                            <Button size="sm" variant="outline" type="submit">
                              Decline
                            </Button>
                          </form>
                        </div>
                      ) : line.approvedBy ? (
                        <span className="text-xs text-muted-foreground">{line.approvedBy.name}</span>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="grid gap-3 lg:grid-cols-2">
              <form action={addReconLineAction} className="grid gap-2 sm:grid-cols-2">
                <input type="hidden" name="vehicleId" value={vehicle.id} />
                <Input name="title" placeholder="Brake pads" required />
                <Input name="category" placeholder="Mechanical" defaultValue="Mechanical" />
                <Input name="estimate" placeholder="425" />
                <Input name="vendor" placeholder="Vendor" />
                <select name="stage" className="h-9 rounded-md border bg-background px-2 text-sm">
                  <option value="MECHANICAL">Mechanical</option>
                  <option value="BODY">Body</option>
                  <option value="DETAIL">Detail</option>
                  <option value="PHOTOS">Photos</option>
                </select>
                <Button type="submit" variant="outline">
                  Add line
                </Button>
              </form>
              <form action={advanceReconStageAction} className="flex items-end gap-2">
                <input type="hidden" name="vehicleId" value={vehicle.id} />
                <select name="stage" defaultValue={vehicle.reconStage} className="h-9 rounded-md border bg-background px-2 text-sm">
                  <option value="INTAKE">Intake</option>
                  <option value="MECHANICAL">Mechanical</option>
                  <option value="BODY">Body</option>
                  <option value="DETAIL">Detail</option>
                  <option value="PHOTOS">Photos</option>
                  <option value="READY">Ready</option>
                </select>
                <Button type="submit" variant="outline">
                  Move stage
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
