import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import type { Role } from "@/lib/roles";

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = String(credentials?.email ?? "")
          .trim()
          .toLowerCase();
        const password = String(credentials?.password ?? "");
        if (!email || !password) return null;

        const user = await prisma.user.findUnique({
          where: { email },
          include: { organization: true },
        });
        if (!user) return null;

        const ok = await compare(password, user.passwordHash);
        if (!ok) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          organizationId: user.organizationId,
          rooftopId: user.rooftopId,
          role: user.role as Role,
          organizationName: user.organization.name,
          demoMode: user.organization.demoMode,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.userId = user.id;
        token.organizationId = user.organizationId;
        token.rooftopId = user.rooftopId;
        token.role = user.role;
        token.organizationName = user.organizationName;
        token.demoMode = user.demoMode;
        token.email = user.email;
        token.name = user.name;
      } else if (trigger === "update" && token.organizationId) {
        const org = await prisma.organization.findUnique({
          where: { id: String(token.organizationId) },
          select: { demoMode: true, name: true },
        });
        if (org) {
          token.demoMode = org.demoMode;
          token.organizationName = org.name;
        }
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = String(token.userId ?? "");
      session.user.organizationId = String(token.organizationId ?? "");
      session.user.rooftopId = (token.rooftopId as string | null) ?? null;
      session.user.role = (token.role as Role) ?? "APPRAISER";
      session.user.organizationName = String(token.organizationName ?? "");
      session.user.demoMode = Boolean(token.demoMode);
      session.user.email = (token.email as string | undefined) ?? session.user.email;
      session.user.name = (token.name as string | undefined) ?? session.user.name;
      return session;
    },
  },
});
