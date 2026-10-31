import {
  addMemberAction,
  connectApiKeyAction,
  createRooftopAction,
  disconnectCarsxeAction,
  setDemoModeAction,
  startOauthAction,
  updateCacheTtlAction,
  updateRooftopAction,
} from "@/actions/settings";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isOauthConfigured } from "@/lib/env";
import { roleLabel } from "@/lib/roles";
import { prisma } from "@/lib/prisma";
import { getOrganization, requireUser } from "@/server/session";
import { ConnectKeyForm } from "@/app/app/settings/connect-form";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ oauth?: string }>;
}) {
  const user = await requireUser();
  const org = await getOrganization(user.organizationId);
  const members = await prisma.user.findMany({
    where: { organizationId: user.organizationId },
    include: { rooftop: true },
    orderBy: { createdAt: "asc" },
  });
  const params = await searchParams;
  const oauthReady = isOauthConfigured();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Connect the dealership’s CarsXE account, rooftops, and desk users.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>CarsXE connection</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Lotdesk never bills you. Paste the API key from the dealer’s CarsXE dashboard.{" "}
            <a className="underline" href="https://carsxe.com" target="_blank" rel="noreferrer">
              Get a CarsXE API key
            </a>
            . Docs:{" "}
            <a className="underline" href="https://docs.carsxe.com/docs/get-started" target="_blank" rel="noreferrer">
              docs.carsxe.com
            </a>
            .
          </p>
          {org.carsxeConnectedAt ? (
            <p className="text-sm">
              Connected via {org.carsxeAuthMethod ?? "api_key"} · last four {org.carsxeKeyLast4} ·{" "}
              {org.carsxeConnectedAt.toLocaleString()}
            </p>
          ) : (
            <p className="text-sm">No live key yet. Demo mode uses mocked CarsXE responses.</p>
          )}
          {params.oauth === "unconfigured" ? (
            <p className="text-sm text-amber-800">
              OAuth is not configured on this host. Set CARSXE_OAUTH_AUTHORIZE_URL,
              CARSXE_OAUTH_TOKEN_URL, and CARSXE_OAUTH_CLIENT_ID.
            </p>
          ) : null}
          {params.oauth === "connected" ? (
            <p className="text-sm text-emerald-800">CarsXE OAuth connected.</p>
          ) : null}
          {params.oauth === "error" ? (
            <p className="text-sm text-red-700">OAuth callback failed. Try the API key instead.</p>
          ) : null}
          <ConnectKeyForm action={connectApiKeyAction} />
          <div className="flex flex-wrap gap-2">
            <form action={startOauthAction}>
              <Button type="submit" variant="outline" disabled={!oauthReady}>
                {oauthReady ? "Connect with CarsXE OAuth" : "OAuth not configured"}
              </Button>
            </form>
            <form action={disconnectCarsxeAction}>
              <Button type="submit" variant="ghost">
                Disconnect
              </Button>
            </form>
            <form
              action={async () => {
                "use server";
                await setDemoModeAction(!org.demoMode);
              }}
            >
              <Button type="submit" variant="outline">
                {org.demoMode ? "Use live CarsXE data" : "Switch back to demo data"}
              </Button>
            </form>
          </div>
          <form action={updateCacheTtlAction} className="flex items-end gap-2">
            <div className="space-y-2">
              <Label htmlFor="cacheTtlHours">Cache TTL (hours, market/history/recalls)</Label>
              <Input
                id="cacheTtlHours"
                name="cacheTtlHours"
                type="number"
                min={1}
                max={168}
                defaultValue={org.cacheTtlHours}
              />
            </div>
            <Button type="submit" variant="outline">
              Save TTL
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Rooftops</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {org.rooftops.map((rooftop) => (
            <form key={rooftop.id} action={updateRooftopAction} className="grid gap-2 md:grid-cols-6">
              <input type="hidden" name="id" value={rooftop.id} />
              <Input name="name" defaultValue={rooftop.name} />
              <Input name="city" defaultValue={rooftop.city} />
              <Input name="state" defaultValue={rooftop.state} maxLength={2} />
              <Input name="zip" defaultValue={rooftop.zip ?? ""} />
              <Input name="agingThresholdDays" type="number" defaultValue={rooftop.agingThresholdDays} />
              <Button type="submit" variant="outline">
                Save
              </Button>
            </form>
          ))}
          <form action={createRooftopAction} className="grid gap-2 border-t pt-4 md:grid-cols-6">
            <Input name="name" placeholder="Rooftop name" required />
            <Input name="city" placeholder="City" required />
            <Input name="state" placeholder="ST" maxLength={2} required />
            <Input name="zip" placeholder="ZIP" />
            <Input name="agingThresholdDays" type="number" defaultValue={45} />
            <Button type="submit">Add rooftop</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Team</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="text-sm">
            {members.map((member) => (
              <li key={member.id} className="flex justify-between border-b py-2">
                <span>
                  {member.name} · {member.email}
                </span>
                <span className="text-muted-foreground">
                  {roleLabel(member.role)} · {member.rooftop?.name ?? "All rooftops"}
                </span>
              </li>
            ))}
          </ul>
          {user.role === "OWNER" ? (
            <form
              action={async (formData) => {
                "use server";
                await addMemberAction(formData);
              }}
              className="grid gap-2 md:grid-cols-5"
            >
              <Input name="name" placeholder="Name" required />
              <Input name="email" type="email" placeholder="Email" required />
              <Input name="password" type="password" placeholder="Temp password" required />
              <select name="role" className="h-9 rounded-md border bg-background px-2 text-sm">
                <option value="APPRAISER">Appraiser</option>
                <option value="MANAGER">Manager</option>
                <option value="OWNER">Owner</option>
              </select>
              <Button type="submit">Invite</Button>
            </form>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
