function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (!value) {
    throw new Error(`Missing required environment variable ${name}`);
  }
  return value;
}

export function getEncryptionKey(): string {
  return required("ENCRYPTION_KEY");
}

export function getAuthSecret(): string {
  return required("AUTH_SECRET", process.env.NEXTAUTH_SECRET);
}

export function getAppUrl(): string {
  return (
    process.env.APP_URL ??
    process.env.AUTH_URL ??
    process.env.NEXTAUTH_URL ??
    "http://127.0.0.1:43173"
  );
}

export function getCarsxeApiBaseUrl(): string {
  return process.env.CARSXE_API_BASE_URL ?? "https://api.carsxe.com";
}

export type OauthConfig = {
  authorizeUrl: string;
  tokenUrl: string;
  clientId: string;
  clientSecret?: string;
  scopes: string;
  redirectUri: string;
};

export function getCarsxeOauthConfig(): OauthConfig | null {
  const authorizeUrl = process.env.CARSXE_OAUTH_AUTHORIZE_URL;
  const tokenUrl = process.env.CARSXE_OAUTH_TOKEN_URL;
  const clientId = process.env.CARSXE_OAUTH_CLIENT_ID;
  if (!authorizeUrl || !tokenUrl || !clientId) return null;

  return {
    authorizeUrl,
    tokenUrl,
    clientId,
    clientSecret: process.env.CARSXE_OAUTH_CLIENT_SECRET,
    scopes: process.env.CARSXE_OAUTH_SCOPES ?? "vehicle:read",
    redirectUri:
      process.env.CARSXE_OAUTH_REDIRECT_URI ?? `${getAppUrl()}/api/oauth/callback`,
  };
}

export function isOauthConfigured(): boolean {
  return getCarsxeOauthConfig() !== null;
}
