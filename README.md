# Listomat

Web-Applikation zur Verwaltung von (Pack-)Listen. Nuxt-basiert, mit server-seitiger SQLite-DB via Drizzle ORM.

Details zu Planung, Entscheiden und Umsetzung siehe [`docs/`](./docs).

## Setup

```bash
npm install
```

## Development Server

```bash
npm run dev
```

Läuft auf `http://localhost:3000`.

Alternativ via Docker Compose (siehe `docker-compose.yml`).

## Datenbank

```bash
npm run db:generate   # Migration aus schema.ts generieren
npm run db:migrate    # Migrationen ausführen
npm run db:seed       # Admin-User seeden (admin@local / admin)
```

## Production

```bash
npm run build
npm run preview
```
