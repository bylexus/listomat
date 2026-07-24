# Listomat

Nuxt-basierte Web-App zur Verwaltung von (Pack-)Listen. Server-seitige SQLite-DB via Drizzle ORM.

## Massgebliche Dokumente (in dieser Reihenfolge lesen, bei Widerspruch gilt das spätere)

1. `docs/Planung.md` – Grundidee, Entitäten, UI-Module
2. `docs/Entscheide.md` – verbindliche Entscheide und Präzisierungen
3. `docs/Umsetzung.md` – detaillierter Umsetzungsplan: Schema, API-Vertrag, UI-Basis, Etappen

Vor jeder Arbeit an einer neuen Etappe: `docs/Umsetzung.md` zur betreffenden Etappe vollständig lesen.

## Arbeitsregeln (nicht verhandelbar)

- Bei Unklarheiten **fragen**. Keine eigenen Entscheidungen treffen.
- Umsetzung erfolgt in Etappen (siehe `docs/Umsetzung.md`). Nach jeder Etappe **stoppen**; der Entwickler prüft und gibt frei. Nicht eigenmächtig zur nächsten Etappe weitergehen.
- Keine zusätzlichen Dependencies ohne Rückfrage. Minimalismus vor Komfort.
- Kein UI-Framework, kein CSS-Framework, keine Icon-Library. Eigenbau-UI gemäss «UI-Basis» in `docs/Umsetzung.md`.
- Keine Tests.
- Neue Entscheide während der Entwicklung in `docs/Entscheide.md` nachtragen.
- Nach Abschluss einer Etappe: Etappenstatus in `docs/Umsetzung.md` **und** den Abschnitt «Aktueller Stand» hier aktualisieren. `docs/Umsetzung.md` ist stets aktuell zu halten (auch bei Plan-Abweichungen).

## Konventionen

- Code, Tabellen, Felder, Variablen, Kommentare: **englisch**. Deutsch nur in UI-Texten via i18n (de = Default, en).
- Commit-Messages: deutsch, Etappen-Präfix wo passend (z.B. `E6: …`), siehe `git log`.
- Server-Fehler immer via `createError({ statusCode, statusMessage })`; Client zeigt Fehler als Toast (`useToast`).
- Jede API-Route beginnt mit `requireUser`/`requireAdmin`/`requireListAccess`/`requireListOwner` (siehe `server/utils/`).
- IDs: uuidv7. Formatierung: Prettier-Defaults.

## Befehle

- `npm run dev` – Dev-Server (localhost:3000)
- `npm run db:generate` / `db:migrate` / `db:seed` – Drizzle-Migrationen, Admin-Seed (admin@local / admin)

## Aktueller Stand (bei Etappenabschluss aktualisieren)

- Erledigt: E1–E8, E3b (PrimeVue-Ausbau), globale API-Auth-Middleware
- **E9 – Export: umgesetzt, Freigabe ausstehend**
- Nächste Etappe nach Freigabe: E10 – Docker
