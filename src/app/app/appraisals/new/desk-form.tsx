"use client";

import { runDeskLookup, saveAppraisalAction } from "@/actions/desk";
import { EndpointPills, UsageRibbon } from "@/components/usage-ribbon";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { guideAppraisal } from "@/lib/appraisal-guidance";
import { formatMoney } from "@/lib/money";
import { extractRecalls } from "@/lib/carsxe/types";
import type { DeskLookup } from "@/server/carsxe";
import { useRouter } from "next/navigation";
import { useActionState, useState, useTransition } from "react";

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","DC","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","PR","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY",
];

export function DeskForm({
  rooftops,
  defaultRooftopId,
  defaultState,
}: {
  rooftops: { id: string; name: string; state: string }[];
  defaultRooftopId: string;
  defaultState: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [desk, setDesk] = useState<DeskLookup | null>(null);
  const [saveState, saveAction, saving] = useActionState(saveAppraisalAction, null);

  function onLookup(formData: FormData) {
    setError(null);
    start(async () => {
      try {
        const result = await runDeskLookup({
          vin: String(formData.get("vin") ?? "") || undefined,
          plate: String(formData.get("plate") ?? "") || undefined,
          plateState: String(formData.get("plateState") ?? "") || undefined,
          mileage: formData.get("mileage") ? Number(formData.get("mileage")) : undefined,
          condition: (String(formData.get("condition") || "clean") as "clean") ?? "clean",
          state: String(formData.get("state") ?? "") || undefined,
        });
        setDesk(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Lookup failed");
      }
    });
  }

  if (saveState && "id" in saveState && saveState.id) {
    router.push(`/app/appraisals/${saveState.id}`);
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Look up a vehicle</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={onLookup} className="grid gap-4 md:grid-cols-6">
            <div className="space-y-2 md:col-span-3">
              <Label htmlFor="vin">VIN</Label>
              <Input id="vin" name="vin" placeholder="WBAFR7C57CC811956" maxLength={17} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="plate">Or US plate</Label>
              <Input id="plate" name="plate" placeholder="H37SFS" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="plateState">Plate state</Label>
              <select
                id="plateState"
                name="plateState"
                defaultValue=""
                className="h-9 w-full rounded-md border bg-background px-2 text-sm"
              >
                <option value="">—</option>
                {US_STATES.map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="mileage">Mileage</Label>
              <Input id="mileage" name="mileage" type="number" defaultValue={45000} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="condition">Condition</Label>
              <select
                id="condition"
                name="condition"
                defaultValue="clean"
                className="h-9 w-full rounded-md border bg-background px-2 text-sm"
              >
                <option value="excellent">Excellent</option>
                <option value="clean">Clean</option>
                <option value="average">Average</option>
                <option value="rough">Rough</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">Market state</Label>
              <Input id="state" name="state" defaultValue={defaultState} maxLength={2} />
            </div>
            <div className="flex items-end md:col-span-3">
              <Button type="submit" disabled={pending}>
                {pending ? "Calling CarsXE…" : "Decode & value"}
              </Button>
            </div>
          </form>
          {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
          <p className="mt-3 text-xs text-muted-foreground">
            Demo VINs: WBAFR7C57CC811956, 3KPFK4A78HE103497, 1C4JJXR64PW696340. Plate: H37SFS / NJ.
          </p>
        </CardContent>
      </Card>

      {desk ? (
        <>
          <UsageRibbon usage={desk.usage} />
          <EndpointPills usage={desk.usage} />
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>
                  {desk.summary.year} {desk.summary.make} {desk.summary.model} {desk.summary.trim}
                </CardTitle>
                <p className="font-mono text-xs text-muted-foreground">{desk.vin}</p>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-3">
                <Value label="Retail clean" value={formatMoney(desk.summary.retailCents)} />
                <Value label="Wholesale clean" value={formatMoney(desk.summary.wholesaleCents)} />
                <Value label="Trade-in clean" value={formatMoney(desk.summary.tradeInCents)} />
                <Value label="Engine" value={desk.summary.engine ?? "—"} />
                <Value label="Drivetrain" value={desk.summary.drivetrain ?? "—"} />
                <Value label="Color" value={desk.summary.color ?? "—"} />
                <div className="sm:col-span-3 rounded-md border px-3 py-2 text-sm">
                  {desk.summary.historySummary}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Risk</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>Title brands: {desk.summary.brandCount}</p>
                <p>Open recalls: {desk.summary.recallCount}</p>
                <p>Open lien: {desk.summary.hasOpenLien ? "Yes" : "No"}</p>
                <p>Theft flag: {desk.summary.hasTheftFlag ? "Yes" : "No"}</p>
                {extractRecalls(desk.recalls).map((recall, index) => (
                  <div key={index} className="rounded-md bg-amber-50 px-3 py-2 text-amber-950">
                    <p className="font-medium">
                      {recall.NHTSACampaignNumber ?? recall.campaign_number} ·{" "}
                      {recall.Component ?? recall.component}
                    </p>
                    <p>{recall.Summary ?? recall.summary}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
          {(() => {
            const guide = guideAppraisal({
              marketRetailCents: desk.summary.retailCents,
              marketWholesaleCents: desk.summary.wholesaleCents,
              marketTradeInCents: desk.summary.tradeInCents,
              titleBrands: desk.summary.brandCount,
              hasOpenLien: desk.summary.hasOpenLien,
              hasTheftFlag: desk.summary.hasTheftFlag,
            });
            return (
              <Card>
                <CardHeader>
                  <CardTitle>Counter-offer desk</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3 sm:grid-cols-4 text-sm">
                  <Value label="Offer range" value={`${formatMoney(guide.offerLowCents)} – ${formatMoney(guide.offerHighCents)}`} />
                  <Value label="Suggested offer" value={formatMoney(guide.offerCents)} />
                  <Value label="Counter" value={formatMoney(guide.counterCents)} />
                  <Value label="Walk-away" value={formatMoney(guide.walkAwayCents)} />
                  <div className="sm:col-span-4 rounded-md border px-3 py-2">
                    <p className="font-medium">
                      Turn Score {guide.turn.score} · {guide.turn.label}
                    </p>
                    <p className="text-muted-foreground">{guide.turn.rationale[0]}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })()}
          {desk.images.images[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={desk.images.images[0].link}
              alt="CarsXE merchandising image"
              className="h-56 w-full rounded-xl border object-cover"
            />
          ) : null}
          <Card>
            <CardHeader>
              <CardTitle>Save appraisal</CardTitle>
            </CardHeader>
            <CardContent>
              {saveState && "error" in saveState && saveState.error ? (
                <p className="mb-3 text-sm text-red-700">{saveState.error}</p>
              ) : null}
              <form action={saveAction} className="grid gap-4 md:grid-cols-2">
                <input type="hidden" name="vin" value={desk.vin} />
                <input type="hidden" name="plate" value={desk.plate ?? ""} />
                <input type="hidden" name="plateState" value={desk.plateState ?? ""} />
                <input type="hidden" name="year" value={desk.summary.year ?? ""} />
                <input type="hidden" name="make" value={desk.summary.make ?? ""} />
                <input type="hidden" name="model" value={desk.summary.model ?? ""} />
                <input type="hidden" name="trim" value={desk.summary.trim ?? ""} />
                <input type="hidden" name="marketRetailCents" value={desk.summary.retailCents ?? ""} />
                <input type="hidden" name="marketWholesaleCents" value={desk.summary.wholesaleCents ?? ""} />
                <input type="hidden" name="marketTradeInCents" value={desk.summary.tradeInCents ?? ""} />
                <input type="hidden" name="brandCount" value={desk.summary.brandCount} />
                <input type="hidden" name="recallCount" value={desk.summary.recallCount} />
                <input type="hidden" name="hasOpenLien" value={String(desk.summary.hasOpenLien)} />
                <input type="hidden" name="hasTheftFlag" value={String(desk.summary.hasTheftFlag)} />
                <input type="hidden" name="historySummary" value={desk.summary.historySummary} />
                <input type="hidden" name="payload" value={JSON.stringify(desk)} />
                <div className="space-y-2">
                  <Label htmlFor="rooftopId">Rooftop</Label>
                  <select
                    id="rooftopId"
                    name="rooftopId"
                    defaultValue={defaultRooftopId}
                    className="h-9 w-full rounded-md border bg-background px-2 text-sm"
                  >
                    {rooftops.map((rooftop) => (
                      <option key={rooftop.id} value={rooftop.id}>
                        {rooftop.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customerName">Customer</Label>
                  <Input id="customerName" name="customerName" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mileage">Mileage</Label>
                  <Input id="mileage" name="mileage" type="number" defaultValue={45000} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="condition">Condition</Label>
                  <select
                    id="condition"
                    name="condition"
                    defaultValue="CLEAN"
                    className="h-9 w-full rounded-md border bg-background px-2 text-sm"
                  >
                    <option value="EXCELLENT">Excellent</option>
                    <option value="CLEAN">Clean</option>
                    <option value="AVERAGE">Average</option>
                    <option value="ROUGH">Rough</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="offer">Offer (USD)</Label>
                  <Input
                    id="offer"
                    name="offer"
                    defaultValue={
                      desk.summary.wholesaleCents ? (desk.summary.wholesaleCents / 100).toFixed(0) : ""
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <select
                    id="status"
                    name="status"
                    defaultValue="OFFERED"
                    className="h-9 w-full rounded-md border bg-background px-2 text-sm"
                  >
                    <option value="DRAFT">Draft</option>
                    <option value="OFFERED">Offered</option>
                    <option value="ACCEPTED">Accepted</option>
                    <option value="DECLINED">Declined</option>
                  </select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea id="notes" name="notes" rows={3} />
                </div>
                <Button type="submit" disabled={saving}>
                  {saving ? "Saving…" : "Save appraisal"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}

function Value({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}
