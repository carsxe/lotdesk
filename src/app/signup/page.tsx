"use client";

import { signupAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Gauge } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";

export default function SignupPage() {
  const [state, action, pending] = useActionState(signupAction, null);
  return (
    <div className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,#f7f1e6,#efe6d4)] px-4 py-10">
      <div className="w-full max-w-lg rounded-2xl border bg-card p-8 shadow-sm">
        <Link href="/" className="mb-6 flex items-center gap-2 font-semibold">
          <Gauge className="size-5" />
          Lotdesk
        </Link>
        <h1 className="text-2xl font-semibold">Create a dealership</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Starts in demo mode with mocked CarsXE data. Connect your API key when you are ready to
          spend real lookups.
        </p>
        {state?.error ? (
          <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            {state.error}
          </p>
        ) : null}
        <form action={action} className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="dealership">Dealership / group</Label>
            <Input id="dealership" name="dealership" required placeholder="Harbor Automotive" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rooftop">First rooftop</Label>
            <Input id="rooftop" name="rooftop" required placeholder="Downtown" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="city">City</Label>
              <Input id="city" name="city" required placeholder="Portland" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input id="state" name="state" required maxLength={2} placeholder="OR" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Your name</Label>
            <Input id="name" name="name" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" minLength={8} required />
          </div>
          <Button className="sm:col-span-2" type="submit" disabled={pending}>
            {pending ? "Creating…" : "Create account"}
          </Button>
        </form>
      </div>
    </div>
  );
}
