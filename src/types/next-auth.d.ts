import type { Role } from "@/lib/roles";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      organizationId: string;
      rooftopId: string | null;
      role: Role;
      organizationName: string;
      demoMode: boolean;
    };
  }

  interface User {
    id: string;
    organizationId: string;
    rooftopId: string | null;
    role: Role;
    organizationName: string;
    demoMode: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId: string;
    organizationId: string;
    rooftopId: string | null;
    role: Role;
    organizationName: string;
    demoMode: boolean;
  }
}
