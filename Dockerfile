FROM node:22-alpine AS base

RUN apk add --no-cache libc6-compat openssl && corepack enable
WORKDIR /app

FROM base AS deps

COPY package.json pnpm-lock.yaml ./
RUN corepack prepare pnpm@10.20.0 --activate
RUN pnpm install --frozen-lockfile

FROM base AS builder

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build-time placeholders to satisfy required env getters.
ARG BUSINESS_DATABASE_URL="mysql://user:password@127.0.0.1:3306/business_db"
ARG EXTERNAL_DATABASE_URL="mysql://user:password@127.0.0.1:3306/external_db"
ARG JWT_SECRET="build-only-jwt-secret"
ARG SMS_CODE_SECRET="build-only-sms-secret"
ARG ALIYUN_SMS_SIGN_NAME="build-sign"
ARG ALIYUN_SMS_TEMPLATE_CODE="build-template"
ARG ALIYUN_SMS_ACCESS_KEY_ID="build-ak"
ARG ALIYUN_SMS_ACCESS_KEY_SECRET="build-sk"
ARG ALIYUN_OSS_REGION="oss-cn-hangzhou"
ARG ALIYUN_OSS_BUCKET="build-bucket"
ARG MILVUS_ADDRESS="127.0.0.1:19530"

ENV NEXT_TELEMETRY_DISABLED=1
ENV BUSINESS_DATABASE_URL=${BUSINESS_DATABASE_URL}
ENV EXTERNAL_DATABASE_URL=${EXTERNAL_DATABASE_URL}
ENV JWT_SECRET=${JWT_SECRET}
ENV SMS_CODE_SECRET=${SMS_CODE_SECRET}
ENV ALIYUN_SMS_SIGN_NAME=${ALIYUN_SMS_SIGN_NAME}
ENV ALIYUN_SMS_TEMPLATE_CODE=${ALIYUN_SMS_TEMPLATE_CODE}
ENV ALIYUN_SMS_ACCESS_KEY_ID=${ALIYUN_SMS_ACCESS_KEY_ID}
ENV ALIYUN_SMS_ACCESS_KEY_SECRET=${ALIYUN_SMS_ACCESS_KEY_SECRET}
ENV ALIYUN_OSS_REGION=${ALIYUN_OSS_REGION}
ENV ALIYUN_OSS_BUCKET=${ALIYUN_OSS_BUCKET}
ENV MILVUS_ADDRESS=${MILVUS_ADDRESS}

RUN corepack prepare pnpm@10.20.0 --activate
RUN pnpm prisma:business:generate && pnpm prisma:external:generate
RUN pnpm build

FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

RUN apk add --no-cache curl ca-certificates openssl && update-ca-certificates

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Keep prisma schema/migrations available for runtime ops if needed.
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
