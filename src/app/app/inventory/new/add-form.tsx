"use client";

import { createVehicleAction } from "@/actions/inventory";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import { useActionState } from "react";

export function AddVehicleForm({
  rooftops,
  defaultRooftopId,
}: {
  rooftops: { id: string; name: string }[];
  defaultRooftopId: string;
}) {
  const router = useRouter();
  const [state, action, pending] = useActionState(createVehicleAction, null);
  if (state && "id" in state && state.id) {
    router.push(`/app/inventory/${state.id}`);
  }

  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2">
      {state && "error" in state && state.error ? (
        <p className="sm:col-span-2 text-sm text-red-700">{state.error}</p>
      ) : null}
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="vin">VIN</Label>
        <Input id="vin" name="vin" required maxLength={17} placeholder="4T1G11AK1NU012345" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="stockNumber">Stock #</Label>
        <Input id="stockNumber" name="stockNumber" required placeholder="H-2210" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="mileage">Mileage</Label>
        <Input id="mileage" name="mileage" type="number" required defaultValue={20000} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="cost">Cost (USD)</Label>
        <Input id="cost" name="cost" required placeholder="21000" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="listPrice">List price (USD)</Label>
        <Input id="listPrice" name="listPrice" required placeholder="24900" />
      </div>
      <div className="space-y-2 sm:col-span-2">
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
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" name="notes" rows={3} />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Decoding…" : "Add to inventory"}
      </Button>
    </form>
  );
}
