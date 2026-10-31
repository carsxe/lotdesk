import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Gauge } from "lucide-react";
import Link from "next/link";

const LOOPS = [
  {
    title: "Appraisal desk",
    body: "VIN or plate in. CarsXE specs, market value, history, lien/theft, and recalls back. Save the offer.",
  },
  {
    title: "Inventory & recon",
    body: "Stock by VIN or CSV. Track days in stock, cost, list price, rooftop, and recon stage.",
  },
  {
    title: "Price to market",
    body: "See CarsXE retail vs. your asking price. Flag over/under-market and aged units. Apply a suggested price.",
  },
  {
    title: "Merchandising",
    body: "Pull CarsXE images and print a spec sheet that reads like a window sticker — from the same VIN decode.",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(1200px_600px_at_10%_-10%,#d9a44133,transparent),linear-gradient(180deg,#f7f1e6,#f4efe4)]">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2">
          <Gauge className="size-6 text-[oklch(0.3_0.055_250)]" />
          <span className="text-lg font-semibold tracking-tight">Lotdesk</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className={cn(buttonVariants({ variant: "ghost" }))}>
            Sign in
          </Link>
          <Link href="/signup" className={cn(buttonVariants())}>
            Start a rooftop
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-6 pb-24">
        <section className="grid items-center gap-12 py-12 lg:grid-cols-[1.1fr_0.9fr] lg:py-20">
          <div>
            <p className="mb-3 text-sm font-medium uppercase tracking-[0.2em] text-[oklch(0.45_0.06_70)]">
              Free for dealers · pay CarsXE only for data
            </p>
            <h1 className="max-w-xl text-4xl font-semibold tracking-tight text-[oklch(0.22_0.035_250)] sm:text-5xl">
              Inventory, appraisals, and live market pricing — without a DMS tax.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-7 text-[oklch(0.35_0.03_250)]">
              Lotdesk is the open-source desk for used-car operations. CarsXE, Inc. gives the app to
              dealers. You bring your own CarsXE API key. Every decode, value, history, and image
              call is yours — cached so you are not billed twice.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/login" className={cn(buttonVariants({ size: "lg" }))}>
                Open the demo lot
              </Link>
              <Link
                href="https://carsxe.com"
                target="_blank"
                rel="noreferrer"
                className={cn(buttonVariants({ size: "lg", variant: "outline" }))}
              >
                Get a CarsXE API key
              </Link>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Demo: demo@lotdesk.dev / lotdesk-demo
            </p>
          </div>
          <div className="rounded-2xl border bg-card p-6 shadow-sm">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Harbor Downtown</p>
            <h2 className="mt-1 text-xl font-semibold">2022 Toyota Camry XLE</h2>
            <dl className="mt-5 grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-muted-foreground">CarsXE retail</dt>
                <dd className="text-lg font-semibold">$24,900</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Your list</dt>
                <dd className="text-lg font-semibold">$24,900</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Days in stock</dt>
                <dd className="text-lg font-semibold">12</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Title / recalls</dt>
                <dd className="text-lg font-semibold">Clean · 0</dd>
              </div>
            </dl>
            <p className="mt-6 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
              In market. Suggested list holds at CarsXE retail clean.
            </p>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          {LOOPS.map((item) => (
            <article key={item.title} className="rounded-xl border bg-card p-5">
              <h3 className="text-lg font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.body}</p>
            </article>
          ))}
        </section>

        <section className="mt-16 rounded-2xl border bg-[oklch(0.22_0.035_250)] px-8 py-10 text-[oklch(0.97_0.01_85)]">
          <h2 className="text-2xl font-semibold">Hosted by CarsXE, or run it yourself.</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-white/75">
            Multi-tenant ready: dealership accounts, owner/manager/appraiser roles, and multiple
            rooftops. Self-host with Docker Compose. Credentials are encrypted at rest. API-key
            connect works today; OAuth 2.0 + PKCE is wired for a provider CarsXE can turn on later.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/signup" className={cn(buttonVariants({ variant: "secondary" }))}>
              Create a dealership
            </Link>
            <Link
              href="https://docs.carsxe.com"
              target="_blank"
              rel="noreferrer"
              className={cn(buttonVariants({ variant: "ghost" }), "text-white hover:bg-white/10 hover:text-white")}
            >
              CarsXE API docs
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
