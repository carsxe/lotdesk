import { encryptSecret } from "@/lib/crypto";
import { getCarsxeOauthConfig, getEncryptionKey } from "@/lib/env";
import { exchangeAuthorizationCode } from "@/lib/oauth";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.organizationId) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const config = getCarsxeOauthConfig();
  if (!config) {
    return NextResponse.redirect(new URL("/app/settings?oauth=unconfigured", request.url));
  }

  const url = new URL(request.url);
  const error = url.searchParams.get("error");
  if (error) {
    return NextResponse.redirect(new URL(`/app/settings?oauth=error&reason=${error}`, request.url));
  }

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const jar = await cookies();
  const expectedState = jar.get("lotdesk_oauth_state")?.value;
  const verifier = jar.get("lotdesk_oauth_verifier")?.value;

  if (!code || !state || !expectedState || state !== expectedState || !verifier) {
    return NextResponse.redirect(new URL("/app/settings?oauth=error&reason=state", request.url));
  }

  try {
    const tokens = await exchangeAuthorizationCode({
      tokenUrl: config.tokenUrl,
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      redirectUri: config.redirectUri,
      code,
      codeVerifier: verifier,
    });

    const expiresAt = tokens.expires_in
      ? new Date(Date.now() + tokens.expires_in * 1000)
      : null;

    await prisma.organization.update({
      where: { id: session.user.organizationId },
      data: {
        carsxeAuthMethod: "oauth",
        carsxeAccessTokenCipher: encryptSecret(tokens.access_token, getEncryptionKey()),
        carsxeRefreshTokenCipher: tokens.refresh_token
          ? encryptSecret(tokens.refresh_token, getEncryptionKey())
          : null,
        carsxeTokenExpiresAt: expiresAt,
        carsxeConnectedAt: new Date(),
        carsxeKeyLast4: tokens.access_token.slice(-4),
        carsxeKeyCipher: encryptSecret(tokens.access_token, getEncryptionKey()),
        demoMode: false,
      },
    });
  } catch {
    return NextResponse.redirect(new URL("/app/settings?oauth=error&reason=token", request.url));
  }

  jar.delete("lotdesk_oauth_state");
  jar.delete("lotdesk_oauth_verifier");
  return NextResponse.redirect(new URL("/app/settings?oauth=connected", request.url));
}
