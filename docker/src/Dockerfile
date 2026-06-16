FROM node:26-slim AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY nest-cli.json tsconfig*.json ./
COPY src ./src
RUN npm run build

FROM node:26-slim AS runner

ARG DD_GIT_REPOSITORY_URL
ARG DD_GIT_COMMIT_SHA

WORKDIR /app
ENV NODE_ENV=production
ENV DD_GIT_REPOSITORY_URL=${DD_GIT_REPOSITORY_URL}
ENV DD_GIT_COMMIT_SHA=${DD_GIT_COMMIT_SHA}

LABEL org.opencontainers.image.source=${DD_GIT_REPOSITORY_URL}
LABEL org.opencontainers.image.revision=${DD_GIT_COMMIT_SHA}

COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["node", "--enable-source-maps", "dist/main.js"]
