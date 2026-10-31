import { loginAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Gauge } from "lucide-react";
import Link from "next/link";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  return (
    <div className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,#f7f1e6,#efe6d4)] px-4">
      <div className="w-full max-w-md rounded-2xl border bg-card p-8 shadow-sm">
        <Link href="/" className="mb-6 flex items-center gap-2 font-semibold">
          <Gauge className="size-5" />
          Lotdesk
        </Link>
        <h1 className="text-2xl font-semibold">Sign in</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Use your dealership account, or the public demo lot.
        </p>
        {params.error ? (
          <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            Email or password did not match.
          </p>
        ) : null}
        <form action={loginAction} className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" defaultValue="demo@lotdesk.dev" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              defaultValue="lotdesk-demo"
              required
            />
          </div>
          <Button className="w-full" type="submit">
            Open the desk
          </Button>
        </form>
        <p className="mt-4 text-sm text-muted-foreground">
          New rooftop?{" "}
          <Link className="underline" href="/signup">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
