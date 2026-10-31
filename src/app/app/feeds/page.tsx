import { setListingStatusAction, syncChannelAction, upsertChannelAction } from "@/actions/feeds";
import { PageHeader } from "@/components/page-header";
import { DemoBanner } from "@/components/status-badges";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getAppUrl } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { getOrganization, requireUser } from "@/server/session";

export default async function FeedsPage() {
  const user = await requireUser();
  const org = await getOrganization(user.organizationId);
  const channels = await prisma.syndicationChannel.findMany({
    where: { organizationId: user.organizationId },
    include: { listings: { include: { vehicle: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Listing Feeds"
        description="CSV, XML, and JSON endpoints plus a pluggable syndication adapter. Status is tracked per channel."
      />
      <DemoBanner demo={user.demoMode} />
      <Card>
        <CardHeader>
          <CardTitle>Add a channel</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={upsertChannelAction} className="flex flex-wrap items-end gap-2">
            <Input name="name" placeholder="Dealer website" />
            <Input name="slug" placeholder="website" />
            <select name="format" className="h-9 rounded-md border bg-background px-2 text-sm">
              <option value="json">JSON</option>
              <option value="csv">CSV</option>
              <option value="xml">XML</option>
            </select>
            <Button type="submit">Save channel</Button>
          </form>
        </CardContent>
      </Card>
      {channels.map((channel) => (
        <Card key={channel.id}>
          <CardHeader className="flex flex-row items-start justify-between">
            <div>
              <CardTitle>{channel.name}</CardTitle>
              <p className="text-xs text-muted-foreground">
                {channel.adapter} · {channel.format.toUpperCase()} ·{" "}
                <a className="underline" href={`/api/feeds/${org.slug}/${channel.slug}`}>
                  {getAppUrl()}/api/feeds/{org.slug}/{channel.slug}
                </a>
              </p>
            </div>
            <form action={syncChannelAction}>
              <input type="hidden" name="channelId" value={channel.id} />
              <Button type="submit" variant="outline">
                Sync live units
              </Button>
            </form>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-muted-foreground">
                <tr>
                  <th className="pb-2 font-medium">Unit</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium">Last sync</th>
                  <th className="pb-2 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {channel.listings.map((listing) => (
                  <tr key={listing.id} className="border-t">
                    <td className="py-2">
                      {listing.vehicle.year} {listing.vehicle.make} {listing.vehicle.model}
                    </td>
                    <td>{listing.status}</td>
                    <td>{listing.lastSyncAt ? listing.lastSyncAt.toLocaleString() : "—"}</td>
                    <td>
                      <form action={setListingStatusAction}>
                        <input type="hidden" name="id" value={listing.id} />
                        <input type="hidden" name="status" value={listing.status === "PAUSED" ? "LIVE" : "PAUSED"} />
                        <Button size="sm" variant="ghost" type="submit">
                          {listing.status === "PAUSED" ? "Resume" : "Pause"}
                        </Button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {channel.listings.length === 0 ? (
              <p className="text-sm text-muted-foreground">No listings yet. Sync to publish frontline units.</p>
            ) : null}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
