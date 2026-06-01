FROM node:22-alpine AS builder
WORKDIR /app

RUN corepack enable pnpm

COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile --ignore-scripts

COPY . .
RUN pnpm build

FROM node:22-alpine AS runner
WORKDIR /app

RUN corepack enable pnpm

COPY --from=builder /app/package.json ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000

CMD ["pnpm", "start"]