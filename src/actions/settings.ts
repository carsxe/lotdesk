"use server";

import { auth } from "@/auth";
import { encryptSecret, maskSecret } from "@/lib/crypto";
import { getEncryptionKey, isOauthConfigured } from "@/lib/env";
import {
  buildAuthorizeUrl,
  codeChallengeS256,
  generateCodeVerifier,
  generateOauthState,
} from "@/lib/oauth";
import { prisma } from "@/lib/prisma";
import { getOrganization, requireRole, requireUser } from "@/server/session";
import { hash } from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export async function connectApiKeyAction(_prev: { error?: string; ok?: boolean } | null, formData: FormData) {
  const user = await requireRole(["OWNER"]);
  const key = String(formData.get("apiKey") ?? "").trim();
  const live = formData.get("live") === "on";
  if (key.length < 8) return { error: "Paste a CarsXE API key (at least 8 characters)." };

  await prisma.organization.update({
    where: { id: user.organizationId },
    data: {
      carsxeKeyCipher: encryptSecret(key, getEncryptionKey()),
      carsxeKeyLast4: key.slice(-4),
      carsxeConnectedAt: new Date(),
      carsxeAuthMethod: "api_key",
      demoMode: !live,
    },
  });
  revalidatePath("/app/settings");
  return { ok: true };
}

export async function disconnectCarsxeAction() {
  const user = await requireRole(["OWNER"]);
  await prisma.organization.update({
    where: { id: user.organizationId },
    data: {
      carsxeKeyCipher: null,
      carsxeKeyLast4: null,
      carsxeConnectedAt: null,
      carsxeAuthMethod: null,
      carsxeAccessTokenCipher: null,
      carsxeRefreshTokenCipher: null,
      carsxeTokenExpiresAt: null,
      demoMode: true,
    },
  });
  revalidatePath("/app/settings");
}

export async function setDemoModeAction(demoMode: boolean) {
  const user = await requireRole(["OWNER"]);
  await prisma.organization.update({
    where: { id: user.organizationId },
    data: { demoMode },
  });
  const session = await auth();
  if (session) {
    // Session JWT refreshes on next request via update trigger if used.
  }
  revalidatePath("/app");
  revalidatePath("/app/settings");
}

export async function updateCacheTtlAction(formData: FormData) {
  const user = await requireRole(["OWNER", "MANAGER"]);
  const hours = Number(formData.get("cacheTtlHours") ?? 24);
  await prisma.organization.update({
    where: { id: user.organizationId },
    data: { cacheTtlHours: Math.min(168, Math.max(1, hours)) },
  });
  revalidatePath("/app/settings");
}

export async function startOauthAction() {
  await requireRole(["OWNER"]);
  if (!isOauthConfigured()) {
    redirect("/app/settings?oauth=unconfigured");
  }
  const { getCarsxeOauthConfig } = await import("@/lib/env");
  const config = getCarsxeOauthConfig();
  if (!config) redirect("/app/settings?oauth=unconfigured");

  const verifier = generateCodeVerifier();
  const state = generateOauthState();
  const jar = await cookies();
  jar.set("lotdesk_oauth_verifier", verifier, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 600,
  });
  jar.set("lotdesk_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 600,
  });

  redirect(
    buildAuthorizeUrl({
      authorizeUrl: config.authorizeUrl,
      clientId: config.clientId,
      redirectUri: config.redirectUri,
      scopes: config.scopes,
      state,
      codeChallenge: codeChallengeS256(verifier),
    }),
  );
}

export async function createRooftopAction(formData: FormData) {
  const user = await requireRole(["OWNER", "MANAGER"]);
  const name = String(formData.get("name") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const state = String(formData.get("state") ?? "").trim().toUpperCase();
  const zip = String(formData.get("zip") ?? "").trim();
  if (!name || !city || state.length !== 2) return;
  await prisma.rooftop.create({
    data: {
      organizationId: user.organizationId,
      name,
      city,
      state,
      zip: zip || null,
      agingThresholdDays: Number(formData.get("agingThresholdDays") ?? 45),
      targetTurnDays: Number(formData.get("targetTurnDays") ?? 45),
    },
  });
  revalidatePath("/app/settings");
}

export async function updateRooftopAction(formData: FormData) {
  const user = await requireRole(["OWNER", "MANAGER"]);
  const id = String(formData.get("id") ?? "");
  await prisma.rooftop.updateMany({
    where: { id, organizationId: user.organizationId },
    data: {
      name: String(formData.get("name") ?? ""),
      city: String(formData.get("city") ?? ""),
      state: String(formData.get("state") ?? "").toUpperCase(),
      zip: String(formData.get("zip") ?? "") || null,
      agingThresholdDays: Number(formData.get("agingThresholdDays") ?? 45),
      targetTurnDays: Number(formData.get("targetTurnDays") ?? 45),
    },
  });
  revalidatePath("/app/settings");
}

const memberSchema = z.object({
  name: z.string().min(2),
  email: z.email().toLowerCase(),
  password: z.string().min(8),
  role: z.enum(["OWNER", "MANAGER", "APPRAISER"]),
  rooftopId: z.string().optional(),
});

export async function addMemberAction(formData: FormData) {
  const user = await requireRole(["OWNER"]);
  const parsed = memberSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
    rooftopId: formData.get("rooftopId") || undefined,
  });
  if (!parsed.success) return { error: "Name, email, role, and an 8+ character password are required." };

  const exists = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (exists) return { error: "That email is already in use." };

  await prisma.user.create({
    data: {
      organizationId: user.organizationId,
      rooftopId: parsed.data.rooftopId,
      name: parsed.data.name,
      email: parsed.data.email,
      passwordHash: await hash(parsed.data.password, 12),
      role: parsed.data.role,
    },
  });
  revalidatePath("/app/settings");
  return { ok: true };
}

export async function connectionSummary() {
  const user = await requireUser();
  const org = await getOrganization(user.organizationId);
  return {
    connected: Boolean(org.carsxeKeyCipher || org.carsxeAccessTokenCipher),
    method: org.carsxeAuthMethod,
    last4: org.carsxeKeyLast4 ? maskSecret(org.carsxeKeyLast4, 4) : null,
    connectedAt: org.carsxeConnectedAt,
    demoMode: org.demoMode,
    cacheTtlHours: org.cacheTtlHours,
    oauthReady: isOauthConfigured(),
  };
}
