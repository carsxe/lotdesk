import { logoutAction } from "@/actions/auth";
import type { AppUser } from "@/server/session";
import { roleLabel } from "@/lib/roles";
import { Button } from "@/components/ui/button";
import {
  Car,
  ClipboardList,
  Gauge,
  LayoutDashboard,
  LogOut,
  Receipt,
  Settings,
  Tags,
} from "lucide-react";
import Link from "next/link";

const NAV = [
  { href: "/app", label: "Dashboard", icon: LayoutDashboard },
  { href: "/app/appraisals", label: "Appraisals", icon: ClipboardList },
  { href: "/app/inventory", label: "Inventory", icon: Car },
  { href: "/app/pricing", label: "Pricing", icon: Tags },
  { href: "/app/usage", label: "API usage", icon: Receipt },
  { href: "/app/settings", label: "Settings", icon: Settings },
];

export function AppShell({
  user,
  children,
}: {
  user: AppUser;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="bg-sidebar text-sidebar-foreground">
        <div className="flex items-center gap-2 px-5 py-5">
          <Gauge className="size-5 text-sidebar-primary" />
          <div>
            <p className="text-sm font-semibold tracking-wide">Lotdesk</p>
            <p className="text-[11px] text-sidebar-foreground/70">Powered by CarsXE</p>
          </div>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:overflow-visible">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-sidebar-foreground/85 hover:bg-sidebar-accent"
            >
              <item.icon className="size-4" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="hidden border-t border-sidebar-border px-4 py-4 text-xs lg:block">
          <p className="font-medium">{user.organizationName}</p>
          <p className="text-sidebar-foreground/70">
            {user.name} · {roleLabel(user.role)}
          </p>
          {user.demoMode ? <p className="mt-1 text-sidebar-primary">Demo data</p> : null}
        </div>
      </aside>
      <div className="flex min-w-0 flex-col">
        <header className="flex items-center justify-between border-b bg-card/80 px-4 py-3 backdrop-blur">
          <div className="text-sm text-muted-foreground">
            Dealer-owned CarsXE credentials · cache-aware lookups
          </div>
          <form action={logoutAction}>
            <Button variant="ghost" size="sm">
              <LogOut className="size-4" />
              Sign out
            </Button>
          </form>
        </header>
        <main className="flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
