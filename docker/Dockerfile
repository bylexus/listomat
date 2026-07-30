# Production image: multi-stage build (Nuxt build -> slim runtime).
# Build (multi-arch): npm run docker:build

FROM node:24-slim AS build
WORKDIR /app

COPY package.json package-lock.json ./
# --ignore-scripts: skips nuxt prepare (needs sources, runs implicitly in nuxt build);
# bcrypt needs its install script for the native binding, hence the rebuild.
RUN npm ci --ignore-scripts && npm rebuild bcrypt

COPY . .
# Build the app, bundle the migration CLI to /app/migrate.cjs (top level, NOT
# under .output), then strip dev deps.
#
# migrate.cjs is CJS and marks bcrypt + @libsql/client (with its @libsql/*,
# js-base64, ... tree) as --external. Placing it at /app means its nearest
# node_modules is the real, complete /app/node_modules below - so nothing gets
# shadowed by Nitro's partial ESM-only trace in .output/server/node_modules
# (which is why the migrate bundle must live outside .output). The app
# (.output/server/index.mjs) resolves the native libsql binding via the same
# /app/node_modules by Node's upward resolution.
RUN npm run build \
 && npx esbuild server/db/migrate.ts --bundle --platform=node --format=cjs \
      --external:bcrypt --external:@libsql/client \
      --outfile=migrate.cjs \
 && npm prune --omit=dev

FROM node:24-slim
WORKDIR /app
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=3000 \
    DB_URL=file:/app/data/listomat.db

COPY --from=build /app/.output ./.output
COPY --from=build /app/drizzle ./drizzle
COPY --from=build /app/migrate.cjs ./migrate.cjs
COPY --from=build /app/node_modules ./node_modules

RUN mkdir -p /app/data
VOLUME /app/data
EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]
