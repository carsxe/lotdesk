import { submitBetaFeedbackAction, toggleFlagAction } from "@/actions/lab";
import { PageHeader } from "@/components/page-header";
import { DemoBanner } from "@/components/status-badges";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { BETA_FEATURES } from "@/lib/flags";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/server/session";
import Link from "next/link";

export default async function LabPage() {
  const user = await requireUser();
  const [flags, feedback] = await Promise.all([
    prisma.featureFlag.findMany({ where: { organizationId: user.organizationId } }),
    prisma.betaFeedback.findMany({
      where: { organizationId: user.organizationId },
      include: { user: true },
      orderBy: { createdAt: "desc" },
      take: 12,
    }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Lab"
        description="Opt into beta tools per organization and send in-app feedback. Nothing here changes spend."
      />
      <DemoBanner demo={user.demoMode} />
      <div className="grid gap-4 md:grid-cols-2">
        {BETA_FEATURES.map((feature) => {
          const flag = flags.find((item) => item.key === feature.key);
          const enabled = flag?.enabled ?? true;
          return (
            <Card key={feature.key}>
              <CardHeader>
                <CardTitle>{feature.name}</CardTitle>
                <p className="text-sm text-muted-foreground">{feature.summary}</p>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <Link href={feature.href} className="text-sm underline">
                    Open module
                  </Link>
                  <form action={toggleFlagAction}>
                    <input type="hidden" name="key" value={feature.key} />
                    <input type="hidden" name="enabled" value={enabled ? "false" : "true"} />
                    <Button type="submit" variant={enabled ? "outline" : "default"} size="sm">
                      {enabled ? "Disable" : "Enable"}
                    </Button>
                  </form>
                </div>
                <form action={submitBetaFeedbackAction} className="space-y-2">
                  <input type="hidden" name="flagKey" value={feature.key} />
                  <select name="rating" defaultValue="4" className="h-9 w-full rounded-md border bg-background px-2 text-sm">
                    <option value="1">1 — not useful</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                    <option value="5">5 — keep it</option>
                  </select>
                  <Textarea name="comment" rows={2} placeholder="What should we change?" />
                  <Button type="submit" variant="outline" size="sm">
                    Send feedback
                  </Button>
                </form>
              </CardContent>
            </Card>
          );
        })}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Recent feedback</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {feedback.length === 0 ? (
            <p className="text-muted-foreground">No feedback yet.</p>
          ) : (
            feedback.map((item) => (
              <div key={item.id} className="rounded-md border px-3 py-2">
                <p className="font-medium">
                  {item.flagKey} · {item.rating}/5 · {item.user.name}
                </p>
                <p className="text-muted-foreground">{item.comment ?? "No comment"}</p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
