import { describe, expect, it, vi } from "vitest";
import {
  buildAuthorizeUrl,
  codeChallengeS256,
  exchangeAuthorizationCode,
  generateCodeVerifier,
} from "./oauth";

describe("oauth pkce", () => {
  it("builds an authorize URL from configuration only", () => {
    const url = buildAuthorizeUrl({
      authorizeUrl: "https://auth.example.test/oauth/authorize",
      clientId: "lotdesk",
      redirectUri: "http://127.0.0.1:43173/api/oauth/callback",
      scopes: "vehicle:read",
      state: "abc",
      codeChallenge: "challenge",
    });
    expect(url).toContain("https://auth.example.test/oauth/authorize");
    expect(url).toContain("response_type=code");
    expect(url).toContain("code_challenge_method=S256");
    expect(url).toContain("client_id=lotdesk");
  });

  it("creates S256 challenges", () => {
    const verifier = generateCodeVerifier();
    expect(verifier.length).toBeGreaterThan(20);
    expect(codeChallengeS256(verifier)).not.toBe(verifier);
  });

  it("exchanges an authorization code", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ access_token: "tok", expires_in: 3600 }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    const tokens = await exchangeAuthorizationCode({
      tokenUrl: "https://auth.example.test/oauth/token",
      clientId: "lotdesk",
      redirectUri: "http://127.0.0.1:43173/api/oauth/callback",
      code: "code-1",
      codeVerifier: "verifier-1",
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });
    expect(tokens.access_token).toBe("tok");
    expect(fetchImpl).toHaveBeenCalledOnce();
  });
});
