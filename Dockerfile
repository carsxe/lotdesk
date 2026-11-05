FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npx prisma generate && npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=43173
ENV HOSTNAME=0.0.0.0
RUN apk add --no-cache openssl
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
# Demo seed (tsx prisma/seed.ts) imports these modules. Do not copy all of src/.
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY --from=builder /app/src/lib/carsxe/fixtures.ts /app/src/lib/carsxe/types.ts ./src/lib/carsxe/
COPY --from=builder /app/src/lib/stocking.ts ./src/lib/stocking.ts
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
EXPOSE 43173
ENTRYPOINT ["/entrypoint.sh"]
