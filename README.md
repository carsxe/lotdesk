# Lotdesk

Free, open-source inventory, appraisal, and pricing for car dealers. **CarsXE, Inc.** gives the app away. Dealers pay CarsXE only for the vehicle data their own account consumes.

Lotdesk is a modern alternative to closed dealer inventory desks: VIN/plate appraisal, live market pricing, aging and recon, merchandising helpers, and a lot-health dashboard — all backed by the [public CarsXE API](https://docs.carsxe.com).

![Dashboard](docs/screenshots/dashboard.png)

## What it does

- **Appraisal / trade-in desk** — VIN or US plate → CarsXE specs, market value, history, lien/theft, recalls. Save the offer. Stock accepted units.
- **Inventory** — add by VIN or CSV. Days in stock, cost, list, rooftop, status, recon stage.
- **Pricing** — CarsXE retail clean vs. asking price. Over/under-market and aging flags. One-click suggested price.
- **Merchandising** — CarsXE images plus a printable spec sheet (window-sticker style) from the VIN decode.
- **Dashboard** — in-stock, average days, recon pipeline, off-market units, monthly CarsXE call counts.
- **Multi-user / multi-rooftop** — owner, manager, appraiser. Multiple stores per group.
- **Usage ledger** — every CarsXE call is visible. Cache hits are not billed twice.

The app is free. Connecting a CarsXE key (or OAuth, when configured) uses **the dealer’s credentials**. Demo mode ships mocked CarsXE responses so you can explore without a key.

## Screenshots

| Desk | Inventory | Pricing |
| --- | --- | --- |
| ![Appraisal](docs/screenshots/appraisal.png) | ![Inventory](docs/screenshots/inventory.png) | ![Pricing](docs/screenshots/pricing.png) |

## Stack

Next.js (App Router) · TypeScript · Tailwind · shadcn/ui · Postgres · Prisma · Auth.js · AES-256-GCM credential encryption.

## Quickstart (Docker Compose)

```bash
git clone <this-repo> lotdesk
cd lotdesk
docker compose up --build
```

Open [http://127.0.0.1:43173](http://127.0.0.1:43173).

Demo login: `demo@lotdesk.dev` / `lotdesk-demo`

Also: `manager@lotdesk.dev` and `appraiser@lotdesk.dev` with the same password.

## Quickstart (local)

```bash
cp .env.example .env
# point DATABASE_URL at a local Postgres 16 database
npm install
npx prisma migrate deploy
npx prisma db seed
npm run dev
```

Dev server: [http://127.0.0.1:43173](http://127.0.0.1:43173)

## Get a CarsXE API key

1. Create an account at [carsxe.com](https://carsxe.com).
2. Copy the key from the CarsXE dashboard.
3. In Lotdesk: **Settings → paste API key**. Optionally uncheck demo mode to spend live lookups.

Read the API: [docs.carsxe.com](https://docs.carsxe.com) · [Get started](https://docs.carsxe.com/docs/get-started)

## CarsXE connection

| Method | v1 |
| --- | --- |
| API key | Fully supported. Encrypted at rest. |
| OAuth 2.0 Authorization Code + PKCE | Implemented. Authorize/token URLs, client id, and scopes come from environment variables. No provider is hard-coded. |

Set these when CarsXE turns on an OAuth provider:

```
CARSXE_OAUTH_AUTHORIZE_URL=
CARSXE_OAUTH_TOKEN_URL=
CARSXE_OAUTH_CLIENT_ID=
CARSXE_OAUTH_CLIENT_SECRET=
CARSXE_OAUTH_SCOPES=vehicle:read
CARSXE_OAUTH_REDIRECT_URI=http://127.0.0.1:43173/api/oauth/callback
```

## Caching and billing

Responses are cached per organization, endpoint, and normalized params.

| Family | Default TTL |
| --- | --- |
| Specs, plates, images, international VIN | 7 days |
| Market value | 12 hours (capped by org setting) |
| History, recalls, lien/theft | org cache TTL (default 24h) |

The usage page and the desk ribbon show billed vs. cache vs. demo.

## Hosted vs self-hosted

- **Managed:** deploy this repo as a multi-tenant service. Each dealership signs up, connects CarsXE, and works their lot.
- **Self-hosted:** `docker compose up`. Bring your own Postgres credentials and `ENCRYPTION_KEY` / `AUTH_SECRET`.

## Architecture

```
Dealer browser
    → Next.js (App Router, server actions)
        → Auth.js (dealership users)
        → Prisma / Postgres (orgs, rooftops, inventory, appraisals, cache, usage)
        → CarsXE gateway (cache → demo fixtures or live https://api.carsxe.com)
```

Credentials never leave the server. The typed client lives in `src/lib/carsxe/`.

## License

MIT © CarsXE, Inc. See [LICENSE](LICENSE) and [CONTRIBUTING](CONTRIBUTING.md).
