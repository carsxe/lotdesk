# Contributing to Lotdesk

Lotdesk is the open-source dealer desk from CarsXE, Inc. Thank you for helping keep it honest, small, and useful on a real lot.

## Ground rules

- Do not commit secrets, API keys, internal hostnames, cloud project IDs, or service names.
- Present vehicle data as **CarsXE data**. Do not name or imply other data vendors.
- Do not use third-party dealer-software trademarks or logos in the product UI.
- Link only to `https://docs.carsxe.com/*` for API documentation.

## Local setup

```bash
cp .env.example .env
# start Postgres, then:
npx prisma migrate dev
npx prisma db seed
npm run dev
```

Or `docker compose up --build`.

## Checks

```bash
npm run lint
npm run typecheck
npm test
```

## Pull requests

- Keep the change to one dealer loop when you can.
- Add or update mocked CarsXE fixtures when you touch the client.
- New endpoints belong in `src/lib/carsxe/client.ts` with a typed test against a mocked `fetch`.
- If a change spends CarsXE calls, show that on the usage ribbon and the usage ledger.
