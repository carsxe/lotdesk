import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import type { Role } from "@/lib/roles";

export type AppUser = {
  id: string;
  email: string;
  name: string;
  organizationId: string;
  rooftopId: string | null;
  role: Role;
  organizationName: string;
  demoMode: boolean;
};

export async function requireUser(): Promise<AppUser> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  return session.user as AppUser;
}

export async function requireRole(allowed: Role[]): Promise<AppUser> {
  const user = await requireUser();
  if (!allowed.includes(user.role)) {
    redirect("/app");
  }
  return user;
}

export async function getOrganization(organizationId: string) {
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    include: { rooftops: { orderBy: { name: "asc" } } },
  });
  if (!org) redirect("/login");
  return org;
}
