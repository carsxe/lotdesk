import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ENDPOINT_DOCS, type CarsxeEndpoint } from "@/lib/carsxe/types";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/server/session";

export default async function UsagePage() {
  const user = await requireUser();
  const rows = await prisma.apiUsage.findMany({
    where: { organizationId: user.organizationId },
    include: { user: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  const billed = rows.filter((row) => row.billed).length;
  const cached = rows.filter((row) => row.cacheHit).length;
  const demo = rows.filter((row) => row.demo).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">CarsXE usage</h1>
        <p className="text-sm text-muted-foreground">
          Lotdesk is free. These rows are the CarsXE calls your account consumed or reused from cache.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Billed</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{billed}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Cache hits</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{cached}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Demo</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{demo}</CardContent>
        </Card>
      </div>
      <Card>
        <CardContent className="overflow-x-auto pt-6">
          <table className="w-full text-sm">
            <thead className="text-left text-muted-foreground">
              <tr>
                <th className="pb-2 font-medium">When</th>
                <th className="pb-2 font-medium">Action</th>
                <th className="pb-2 font-medium">Endpoint</th>
                <th className="pb-2 font-medium">VIN</th>
                <th className="pb-2 font-medium">Who</th>
                <th className="pb-2 font-medium">Cost</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-t">
                  <td className="py-2 text-xs text-muted-foreground">
                    {row.createdAt.toLocaleString()}
                  </td>
                  <td>{row.action}</td>
                  <td>
                    <a
                      className="underline"
                      href={ENDPOINT_DOCS[row.endpoint as CarsxeEndpoint] ?? "https://docs.carsxe.com"}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {row.endpoint}
                    </a>
                  </td>
                  <td className="font-mono text-xs">{row.vin ?? "—"}</td>
                  <td>{row.user?.name ?? "System"}</td>
                  <td>
                    {row.demo ? (
                      <Badge variant="secondary">Demo</Badge>
                    ) : row.cacheHit ? (
                      <Badge variant="outline">Cache</Badge>
                    ) : row.billed ? (
                      <Badge>Billed</Badge>
                    ) : (
                      <Badge variant="outline">Free</Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
