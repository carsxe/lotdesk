"use client";

import { importInventoryCsv } from "@/actions/inventory";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState, useTransition } from "react";

export default function ImportPage() {
  const [pending, start] = useTransition();
  const [result, setResult] = useState<{ created: number; failed: number; errors?: string[] } | null>(
    null,
  );

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>Bulk import by VIN</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          CSV columns: <code>vin,mileage,cost,listPrice,stockNumber,rooftop,acquiredAt</code>. Each
          new VIN spends a CarsXE desk lookup unless it is already cached.
        </p>
        <form
          action={(formData) => {
            start(async () => {
              const next = await importInventoryCsv(formData);
              setResult(next);
            });
          }}
          className="space-y-4"
        >
          <input
            type="file"
            name="file"
            accept=".csv,text/csv"
            required
            className="block text-sm"
          />
          <Button type="submit" disabled={pending}>
            {pending ? "Importing…" : "Import CSV"}
          </Button>
        </form>
        {result ? (
          <div className="rounded-md border px-3 py-2 text-sm">
            <p>
              Created {result.created}. Failed {result.failed}.
            </p>
            {result.errors?.length ? (
              <ul className="mt-2 list-disc pl-5">
                {result.errors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
