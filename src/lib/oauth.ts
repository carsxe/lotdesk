import { createHash, randomBytes } from "node:crypto";

export function generateCodeVerifier(): string {
  return randomBytes(32).toString("base64url");
}

export function codeChallengeS256(verifier: string): string {
  return createHash("sha256").update(verifier).digest("base64url");
}

export function generateOauthState(): string {
  return randomBytes(16).toString("base64url");
}

export function buildAuthorizeUrl(input: {
  authorizeUrl: string;
  clientId: string;
  redirectUri: string;
  scopes: string;
  state: string;
  codeChallenge: string;
}): string {
  const url = new URL(input.authorizeUrl);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", input.clientId);
  url.searchParams.set("redirect_uri", input.redirectUri);
  url.searchParams.set("scope", input.scopes);
  url.searchParams.set("state", input.state);
  url.searchParams.set("code_challenge", input.codeChallenge);
  url.searchParams.set("code_challenge_method", "S256");
  return url.toString();
}

export type TokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
  scope?: string;
};

export async function exchangeAuthorizationCode(input: {
  tokenUrl: string;
  clientId: string;
  clientSecret?: string;
  redirectUri: string;
  code: string;
  codeVerifier: string;
  fetchImpl?: typeof fetch;
}): Promise<TokenResponse> {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: input.clientId,
    redirect_uri: input.redirectUri,
    code: input.code,
    code_verifier: input.codeVerifier,
  });
  if (input.clientSecret) {
    body.set("client_secret", input.clientSecret);
  }

  const fetchImpl = input.fetchImpl ?? fetch;
  const response = await fetchImpl(input.tokenUrl, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OAuth token exchange failed (${response.status}): ${text}`);
  }

  return (await response.json()) as TokenResponse;
}
