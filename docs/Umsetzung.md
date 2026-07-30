# Umsetzung

Detaillierter Umsetzungsplan. Gilt zusammen mit `Planung.md` und `Entscheide.md`; bei Widerspruch gilt dieses Dokument. Die Umsetzung erfolgt in Etappen (siehe unten). **Jede Etappe wird erst nach manueller Freigabe durch den Entwickler abgeschlossen. Nicht eigenmächtig zur nächsten Etappe weitergehen.**

Bei Unklarheiten: fragen, keine eigenen Entscheidungen treffen.

## Konventionen

- Code, Tabellen, Felder, Variablen, Kommentare: **englisch**. Deutsch nur in UI-Texten via i18n.
- Keine zusätzlichen Dependencies ohne Rückfrage. Minimalismus vor Komfort.
- Keine Tests.
- Fehler serverseitig immer mit `createError({ statusCode, statusMessage })`. Client zeigt Fehler als Toast über das eigene Toast-System (`useToast`, siehe «UI-Basis»).
- Formatierung: Prettier-Defaults, keine ESLint-Extraregeln.

## Stack

| Bereich | Wahl |
|---|---|
| Framework | Nuxt (neueste stabile Version), Node LTS |
| UI | Eigenbau: Standard-HTML/CSS/JS, natives `<dialog>`, eigenes Toast-System, inline SVG-Icons. CSS via Custom Properties, Flexbox/Grid, Media Queries. Keine UI-Library, kein CSS-Framework |
| i18n | @nuxtjs/i18n, Sprachen `de` (Default), `en`, Browser-Detection, keine DB-Speicherung |
| DB | SQLite-Datei, Zugriff via `@libsql/client` (`file:`-URL), Drizzle ORM (`drizzle-orm/libsql`) |
| Migrationen | drizzle-kit |
| Auth | nuxt-auth-utils (versiegelte httpOnly-Session-Cookies), bcrypt für Passwörter |
| IDs | uuidv7, generiert in der App mit npm-Paket `uuidv7` |
| Export | pdfkit (PDF), exceljs (Excel) |
| Deployment | Docker Compose: App-Container + Init-Container für Migrationen |

## Projektstruktur

```
app/
  assets/css/main.css # Design-Tokens + Basis-Styles (global eingebunden via nuxt.config `css`)
  components/
    ui/              # UiModal.vue, UiConfirm.vue, UiToasts.vue, UiProgress.vue
    ...              # weitere Vue-Komponenten
  composables/       # useToast.ts, useConfirm.ts, useApi-Fehlerbehandlung etc.
  layouts/
  middleware/        # auth.global.ts (Route-Schutz client-seitig)
  pages/
server/
  api/               # REST-Routen (Struktur siehe API)
  db/
    schema.ts        # Drizzle-Schema (komplett, siehe unten)
    index.ts         # DB-Client + drizzle-Instanz
    seed.ts          # Admin-Seed
  utils/
    auth.ts          # requireUser, requireAdmin
    access.ts        # requireListAccess, requireListOwner
    validate.ts      # zentrale Mini-Validierung
    sort.ts          # Neunummerierung
i18n/
  locales/de.json, en.json
drizzle/             # generierte Migrationen
drizzle.config.ts
docker/              # Dockerfile(s), compose
data/                # SQLite-Datei (gitignored)
```

## Datenbank-Schema (verbindlich)

`server/db/schema.ts` – exakt so umsetzen:

```ts
import { sqliteTable, text, integer, uniqueIndex, index } from 'drizzle-orm/sqlite-core'

// Timestamps als Unix-Millisekunden (integer, mode: 'timestamp_ms')

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),                    // uuidv7
  email: text('email').notNull().unique(),        // dient als Username, lowercase speichern
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  passwordHash: text('password_hash').notNull(),  // bcrypt
  role: text('role', { enum: ['admin', 'user'] }).notNull().default('user'),
  active: integer('active', { mode: 'boolean' }).notNull().default(true),
  lastLoginAt: integer('last_login_at', { mode: 'timestamp_ms' }),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
})

export const lists = sqliteTable('lists', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  ownerId: text('owner_id').notNull().references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
}, (t) => [index('lists_owner_idx').on(t.ownerId)])

export const listShares = sqliteTable('list_shares', {
  id: text('id').primaryKey(),
  listId: text('list_id').notNull().references(() => lists.id, { onDelete: 'cascade' }),
  sharedUserId: text('shared_user_id').notNull().references(() => users.id),
}, (t) => [
  uniqueIndex('list_shares_unique').on(t.listId, t.sharedUserId),
  index('list_shares_user_idx').on(t.sharedUserId),
])
// Hinweis: kein separates owner-Feld nötig; Owner steht auf lists.ownerId.

export const groups = sqliteTable('groups', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  ownerId: text('owner_id').notNull().references(() => users.id),
  listId: text('list_id').references(() => lists.id, { onDelete: 'cascade' }),
    // null => Vorlagen-Gruppe; gesetzt => Listen-Gruppe
  origGroupId: text('orig_group_id'),  // reine Info, keine FK-Constraint
  sortOrder: integer('sort_order').notNull().default(0),
}, (t) => [index('groups_list_idx').on(t.listId), index('groups_owner_idx').on(t.ownerId)])

export const entries = sqliteTable('entries', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  comment: text('comment'),
  groupId: text('group_id').notNull().references(() => groups.id, { onDelete: 'cascade' }),
  creatorId: text('creator_id').notNull().references(() => users.id),  // reine Info
  sortOrder: integer('sort_order').notNull().default(0),
  done: integer('done', { mode: 'boolean' }).notNull().default(false),
    // bei Vorlagen-Gruppen ungenutzt, bleibt false
  quantity: integer('quantity'),  // nullable; null = keine Anzahl, 0 ist gültig
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
})
```

Regeln:
- User werden nie gelöscht, nur `active = false`. Kein Delete-Endpoint für User.
- Kaskaden: Liste löschen → Gruppen → Einträge (DB-seitig via `onDelete: 'cascade'`). Vorlagen-Gruppe löschen → deren Einträge.
- E-Mail immer lowercase getrimmt speichern und vergleichen.

## Seed

`server/db/seed.ts`, idempotent (prüft, ob Admin existiert): Admin-User `admin@local`, Passwort `admin` (bcrypt), Vorname `Admin`, Nachname `Admin`, role `admin`. Aufrufbar via npm-Script `db:seed`.

## Auth & Session

- nuxt-auth-utils. Session-Inhalt:
  ```ts
  { user: { id, email, firstName, lastName, role }, impersonatedBy?: string /* admin user id */ }
  ```
- Login (`POST /api/auth/login`): email + password. Prüft `active`, bcrypt-Vergleich, setzt `lastLoginAt`, setzt Session. Fehler immer generisch 401 "Invalid credentials" (kein User-Enumeration-Leak).
- Logout (`POST /api/auth/logout`): Session löschen.
- `GET /api/auth/me`: aktuelle Session-Userdaten (inkl. `impersonatedBy`-Flag).
- Impersonation (nur Admin):
  - `POST /api/admin/impersonate` `{ userId }`: Session wird auf Ziel-User gesetzt, `impersonatedBy` = ursprüngliche Admin-Id. Nicht verschachtelbar (Fehler, wenn bereits impersonated).
  - `POST /api/admin/impersonate/stop`: nur erlaubt, wenn `impersonatedBy` gesetzt; Session zurück auf den Admin.
  - UI: bei aktiver Impersonation permanenter Banner mit User-Name und Button "Zurück zu Admin".
- Client-Middleware `auth.global.ts`: ohne Session → Redirect auf `/login` (ausser Login-Seite). Admin-Seiten zusätzlich rollengeprüft.

## Server-Utils (verbindliche Signaturen)

```ts
// server/utils/auth.ts
async function requireUser(event): Promise<SessionUser>   // 401 wenn keine Session
async function requireAdmin(event): Promise<SessionUser>  // 403 wenn role !== 'admin'

// server/utils/access.ts
async function requireListAccess(event, listId): Promise<{ user, list, isOwner }>
  // Owner ODER Share vorhanden, sonst 404 (nicht 403, kein Existenz-Leak)
async function requireListOwner(event, listId): Promise<{ user, list }>  // sonst 404

// server/utils/validate.ts – Mini-Helfer, keine Lib:
function requireString(body, field, { max = 500 } = {}): string  // trim, 400 bei leer/fehlend/zu lang
function optionalString(body, field, { max = 2000 } = {}): string | null
function requireBool(body, field): boolean
function optionalInt(body, field, { min = 0, max = 999999 } = {}): number | null
  // undefined/null/'' => null; sonst ganze Zahl im Bereich, 400 bei ungültig
```

Jede API-Route beginnt mit dem passenden `require*`-Aufruf. Vorlagen-Gruppen (listId null) sind strikt privat: Zugriff nur wenn `ownerId === user.id`.

## API-Vertrag

Alle Routen unter `server/api/`. JSON in/out. Erfolgs-Response ist direkt das Objekt/Array (kein Envelope).

### Auth
| Methode/Pfad | Body | Antwort |
|---|---|---|
| POST /api/auth/login | { email, password } | { user } |
| POST /api/auth/logout | – | { ok: true } |
| GET /api/auth/me | – | { user, impersonatedBy? } |

### Admin (alle: requireAdmin)
| Methode/Pfad | Body | Antwort |
|---|---|---|
| GET /api/admin/users | – | User[] (ohne passwordHash) |
| POST /api/admin/users | { email, firstName, lastName, password } | User |
| PATCH /api/admin/users/:id | beliebige Teilmenge: { email, firstName, lastName, active, role, password } | User |
| POST /api/admin/impersonate | { userId } | { ok: true } |
| POST /api/admin/impersonate/stop | – | { ok: true } |

Keine Passwortregeln. Admin kann sich nicht selbst deaktivieren (400).

### Vorlagen-Gruppen (listId = null; alle: nur eigene)
| Methode/Pfad | Body | Antwort |
|---|---|---|
| GET /api/templates | – | Group[] inkl. entries[], sortiert |
| POST /api/templates | { name } | Group |
| PATCH /api/templates/:id | { name?, sortOrder-Handling siehe Sortierung } | Group |
| DELETE /api/templates/:id | – | { ok: true } |
| POST /api/templates/:id/entries | { name, comment? } | Entry |
| PATCH /api/templates/:id/entries/:entryId | { name?, comment?, quantity? } | Entry; quantity: int >= 0 oder null (löscht die Anzahl) |
| DELETE /api/templates/:id/entries/:entryId | – | { ok: true } |
| PUT /api/templates/order | { ids: string[] } | { ok: true } (Neunummerierung) |
| PUT /api/templates/:id/entries/order | { ids: string[] } | { ok: true } |

### Listen
| Methode/Pfad | Body | Antwort |
|---|---|---|
| GET /api/lists | – | { own: ListSummary[], shared: ListSummary[] }; ListSummary = { id, name, ownerName, progress: { done, total }, updatedAt } |
| POST /api/lists | { name? } (Default "Neue Liste" macht der Client via i18n; Server-Fallback identisch) | List |
| GET /api/lists/:id | – | List inkl. groups[] inkl. entries[], alles sortiert, plus { isOwner, shares: [{ id, email }] (nur für Owner) } |
| PATCH /api/lists/:id | { name } | nur Owner | List |
| DELETE /api/lists/:id | – | nur Owner | { ok: true } |
| POST /api/lists/:id/duplicate | – | Owner oder Shared; Kopie gehört dem Aufrufer; Kommentare bleiben, done → false; Name = Original + " (Kopie)" (i18n) | List |
| POST /api/lists/:id/reset | – | setzt alle done der Liste auf false | { ok: true } |

### Freigaben (nur Owner)
| Methode/Pfad | Body | Antwort |
|---|---|---|
| POST /api/lists/:id/shares | { email } | { id, email }; 404 wenn E-Mail unbekannt/inaktiv; 400 bei Owner selbst oder Duplikat |
| DELETE /api/lists/:id/shares/:shareId | – | { ok: true } |

### Listen-Gruppen & Einträge (Owner oder Shared: requireListAccess)
| Methode/Pfad | Body | Antwort |
|---|---|---|
| POST /api/lists/:id/groups | { name } (Default "Neue Gruppe" macht der Client via i18n) | Group |
| PATCH /api/lists/:id/groups/:groupId | { name? } | Group |
| DELETE /api/lists/:id/groups/:groupId | – | { ok: true } |
| POST /api/lists/:id/groups/:groupId/save-as-template | – | kopiert Gruppe+Einträge als Vorlage des Aufrufers (done ignoriert, Kommentare mit, origGroupId gesetzt) | Group |
| POST /api/lists/:id/groups/from-template | { templateId } | Vorlage muss dem Aufrufer gehören; kopiert Gruppe+Einträge in die Liste ans Ende, origGroupId gesetzt | Group inkl. entries[] |
| POST /api/lists/:id/groups/:groupId/entries | { name, comment? } | Entry |
| PATCH /api/lists/:id/groups/:groupId/entries/:entryId | { name?, comment?, done?, quantity? } | Entry; quantity: int >= 0 oder null (löscht die Anzahl) |
| DELETE /api/lists/:id/groups/:groupId/entries/:entryId | – | { ok: true } |
| PUT /api/lists/:id/groups/order | { ids: string[] } | { ok: true } |
| PUT /api/lists/:id/groups/:groupId/entries/order | { ids: string[], movedEntryId?: string } | { ok: true }; wenn movedEntryId aus anderer Gruppe derselben Liste stammt, wird er in diese Gruppe verschoben (groupId umsetzen) und einsortiert |

Jede mutierende Listen-Operation aktualisiert `lists.updatedAt`.

### Export
| Methode/Pfad | Query | Antwort |
|---|---|---|
| GET /api/lists/:id/export/pdf | ?status=current \| empty | PDF-Download (Content-Disposition attachment, Dateiname = Listenname) |
| GET /api/lists/:id/export/xlsx | ?status=current \| empty | Excel-Download |

## Sortierung (Neunummerierung)

`server/utils/sort.ts`: Der Client sendet nach Drag'n'drop die vollständige, neue Reihenfolge als `ids: string[]`. Server validiert, dass die Ids exakt der betroffenen Menge entsprechen (gleiche Ids, keine fremden), und schreibt `sortOrder = index` (0-basiert) in einer Transaktion. Keine Lücken-Technik.

## Kopierlogik (zentral implementieren, 3 Verwendungen)

Eine Funktion `copyGroup({ sourceGroupId, targetListId | null, newOwnerId, resetDone })`:
- neue uuidv7 für Gruppe und alle Einträge
- `origGroupId` = Quell-Gruppen-Id
- Kommentare und `quantity` immer mitkopieren
- `done`: bei `resetDone` false, sonst übernehmen (aktuell überall resetDone = true bzw. irrelevant)
- `sortOrder` der Einträge übernehmen; Gruppe ans Ende der Zielmenge
Verwendungen: Vorlage→Liste, Liste→Vorlage, Liste duplizieren (Schleife über Gruppen).

## UI-Basis (Eigenbau, ersetzt PrimeVue)

Kein UI-Framework. Verbindliche Bausteine:

### `app/assets/css/main.css`
- CSS Custom Properties auf `:root`: Farben (`--color-primary`, `--color-danger`, `--color-surface`, `--color-border`, `--color-text`, `--color-text-muted`), Abstände (`--space-1..4`), `--radius`, `--shadow`.
- Kleines Reset (`box-sizing: border-box`, Margins weg), Basis-Typografie (System-Font-Stack).
- Klassen (nur diese, keine Utility-Explosion):
  - `.btn`, `.btn-primary`, `.btn-danger`, `.btn-ghost` (Icon-/Textbuttons ohne Rahmen), `disabled`-Zustand
  - `input`, `select`, `textarea`: global gestylt (Rahmen, Radius, Focus-Ring)
  - `.card` (Rahmen, Radius, Schatten, Padding)
  - `table`: global gestylt (Zebra optional, Padding, Rahmen unten)
  - `.form-field` (Label + Input untereinander), `.toolbar` (horizontale Buttonleiste, flex, gap)
- Einbindung: `nuxt.config.ts` → `css: ['~/assets/css/main.css']`.

### Komponenten `app/components/ui/`
- **UiModal.vue**: Wrapper um natives `<dialog>`. Props: `open: boolean`; Emits: `close`. `watch(open)` ruft `showModal()`/`close()` auf der `<dialog>`-Ref auf. Slots: `header`, default, `footer`. ESC und Klick auf Backdrop schliessen (Backdrop: `click`-Handler auf `<dialog>`, prüfen ob `event.target === dialog`).
- **UiConfirm.vue**: eine globale Instanz im Default-Layout. Nutzt `UiModal`, zeigt Nachricht + Buttons «Abbrechen»/«OK» (i18n).
- **UiToasts.vue**: eine globale Instanz im Default-Layout. Fixe Position oben rechts, rendert Toastliste aus `useToast`, Farbcodierung nach `severity` (`success`, `error`).
- **UiProgress.vue**: Props `done: number`, `total: number`. Einfacher Balken (äusseres div mit Hintergrund, inneres div mit Breite in %), daneben/darüber Text «done/total». Kein `<progress>`-Element (schwer stylebar).

### Composables
- **useToast.ts**: globale Toastliste via `useState('toasts', () => [])`. `toast.add({ severity, message })` mit auto-generierter id, Auto-Dismiss nach 5 s (`setTimeout`), `toast.remove(id)`.
- **useConfirm.ts**: Promise-basiert. `confirm(message: string): Promise<boolean>`. Globaler State (`useState`) mit `{ message, resolve }`; `UiConfirm.vue` liest diesen State und ruft `resolve(true/false)` beim Buttonklick.

### Icons
- Wenige inline SVGs direkt in den Templates (24×24 viewBox, `stroke="currentColor"`, `fill="none"`): Stift, Papierkorb, Plus, Teilen, Export/Download, Duplizieren, Reset, Drag-Handle (≡), Schliessen (×), Logout. Kein Icon-Paket, keine `UiIcon`-Abstraktion nötig; bei Wiederverwendung als kleine Komponente extrahieren ist erlaubt.

## UI

### Seiten
- `/login`
- `/` – Listenübersicht (Kacheln: eigene + geteilte, Abschnittstitel; Kachel: Name + Fortschritt "3/7" + `UiProgress`; Klick öffnet (ab E7); Aktionen: neu, umbenennen (nur Owner, contenteditable auf der Kachel mit Stift-Icon), duplizieren, löschen (nur Owner, mit Bestätigung), teilen (nur Owner))
- `/lists/:id` – Listen-Detail
- `/templates` – Vorlagen-Verwaltung
- `/admin/users` – Userverwaltung (nur Admin)

### Listen-Detail
- Titel als contenteditable-H1 (nur Owner editierbar), Speichern bei blur.
- Gruppen als Karten im Grid: mobile 1 Spalte, ab Tablet (min-width: 768px) 2 Spalten. CSS Grid, keine Zusatzlib.
- Gruppen-Titel contenteditable; Karten-Aktionen: löschen (Bestätigungsdialog), als Vorlage speichern. Neue Gruppe via Plus-Button in der Toolbar: kleiner Dialog mit Bezeichnungs-Eingabe oder Vorlagen-Auswahl (Select) zum Einfügen.
- Einträge: Checkbox (done) + Name (contenteditable) + Anzahl (schmales `<input type="number">`, min 0, leer = keine Anzahl) + Kommentar (kleiner, Input-Feld) + Löschen-Icon (ohne Bestätigung). Anzahl speichert implizit bei blur/change (analog Kommentar). Neue Einträge über Eingabefeld am Gruppenende (Enter = anlegen); dort kein Anzahl-Feld, neue Einträge starten ohne Anzahl.
- Fortschritt pro Gruppe im Karten-Header (z.B. "2/5").
- Drag'n'drop: Gruppen untereinander sortieren; Einträge innerhalb Gruppe und zwischen Gruppen. Umsetzung mit `vue-draggable-plus` (SortableJS-basiert, Vue-3-kompatibel, Touch-Support). Keine weiteren DnD-Libs.
- Toolbar: Reset-Haken (mit Bestätigung), Duplizieren, Export-Dialog (Format PDF/Excel + Status aktuell/leer), Teilen-Dialog (nur Owner: E-Mail-Feld, Liste der Freigaben mit Entfernen).
- Alle Änderungen speichern implizit sofort; bei API-Fehler Toast + UI-Zustand zurücksetzen (neu laden ist akzeptabel).

### Vorlagen-Seite
- Wie Listen-Detail, aber ohne done-Checkboxen, ohne Fortschritt, ohne Export/Teilen/Reset. Gruppen + Einträge CRUD + DnD-Sortierung.

### Admin-Seite
- Tabelle aller User (natives `<table>`, global gestylt): E-Mail, Name, Rolle, aktiv, letzter Login. Aktionen: neu, bearbeiten (Dialog via `UiModal`), aktiv/inaktiv, Passwort setzen, impersonate. Keine Pagination/Sortierung/Filter nötig.

## Export-Layouts

### PDF (pdfkit)
- A4 hochkant, Ränder 15 mm.
- Kopf: Listenname als Titel, darunter klein Exportdatum.
- Inhalt **zweispaltig**: Gruppen werden nacheinander in Spalten gesetzt (erst Spalte 1 füllen, dann Spalte 2, dann neue Seite). **Eine Gruppe wird nie umbrochen**: vor dem Zeichnen Gruppenhöhe berechnen (Titel + n Einträge × Zeilenhöhe, Kommentare eingerechnet); passt sie nicht mehr in die aktuelle Spalte, in die nächste Spalte/Seite springen. Gruppen, die länger als eine ganze Spalte sind: ausnahmsweise umbrechen (sonst unlösbar).
- Gruppe: Gruppenname fett, darunter Einträge: Checkbox-Kästchen ▢ (bei status=current und done: ☑ oder gefülltes Kästchen), Eintragsname mit Anzahl als Präfix («5× Socken»; ohne Anzahl nur der Name), Kommentar in kleinerer, kursiver Schrift dahinter oder darunter.
- Schrift: Standard-Helvetica von pdfkit, keine Font-Einbettung.

### Excel (exceljs)
- Ein Sheet, Name = Listenname (gekürzt auf 31 Zeichen, verbotene Zeichen ersetzt).
- Zeile 1: Listenname, fett, Grösse ~16.
- Pro Gruppe: Leerzeile, dann Gruppenname fett mit Hintergrundfarbe; darunter Einträge in Spalten: A = Erledigt ("x" oder leer bei status=current; immer leer bei status=empty), B = Anzahl (Zahl oder leer), C = Bezeichnung, D = Kommentar. Spaltenbreiten sinnvoll fix setzen.

## Docker

- Dev (unverändert): `docker/Dockerfile.dev` + `docker-compose.yml`, Quellcode als Volume, Entrypoint installiert Dependencies, migriert, seedet, startet `nuxt dev`.
- Prod: `docker/Dockerfile`, Multi-Stage (build → node:24-slim Runtime), `node .output/server/index.mjs`. Runtime-Image enthält `.output/`, `drizzle/` (Migrations-SQL), das Migrations-Bundle `/app/migrate.cjs` und das prod-`node_modules`. Migration + Seed als esbuild-Bundle **`/app/migrate.cjs`** (oberste Ebene, drizzle-orm-Migrator + Seed-Logik aus `server/db/migrate.ts`/`seed-admin.ts` – kein drizzle-kit/tsx im Runtime-Image), Command `node migrate.cjs`. Mountpoint `VOLUME /app/data` für die SQLite-DB, `DB_URL`-Default `file:/app/data/listomat.db`.
  - `migrate.cjs` referenziert `@libsql/client` und `bcrypt` als `--external` (CJS); deren gesamter Abhängigkeitsbaum (`@libsql/*`, `js-base64`, native libsql-Binding, …) muss zur Laufzeit auflösbar sein. Nitros Tracer legt aber nur ESM-Teilkopien nach `.output/server/node_modules`, und Node löst Module vom *nächstgelegenen* `node_modules` – läge `migrate.cjs` unter `.output/server/`, würden diese Teilkopien das vollständige `node_modules` überschatten (fehlende `lib-cjs`-Entrypoints → `MODULE_NOT_FOUND`). Ein Overlay in `.output/server/node_modules` scheitert zudem, weil Nitro dort einzelne Pakete als *Datei* (statt Verzeichnis) ablegt. Lösung: `migrate.cjs` liegt auf `/app` (oberste Ebene), sein nächstgelegenes `node_modules` ist das echte, vollständige `/app/node_modules`. Die App (`.output/server/index.mjs`) findet ihre native libsql-Binding per Upward-Resolution ebenfalls dort.
  - `npm prune --omit=dev` nach dem Build hält `/app/node_modules` prod-only. Rein bauzeitliche/clientseitige Pakete (`nuxt`, `@nuxtjs/i18n`, `vue`, `vue-router`, `vue-draggable-plus`) liegen in `devDependencies` (Nitro-Output ist standalone); serverseitige Runtime-Libs (`@libsql/client`, `bcrypt`, `drizzle-orm`, `exceljs`, `pdfkit`, `uuidv7`, `nuxt-auth-utils`) in `dependencies`. Der Multi-Stage-Build bleibt – erst dadurch enthält das Runtime-Image die Build-Toolchain (nuxt/vite) nicht mehr.
- `docker-compose.prod.yml`: Service `migrate` (gleiches Image, Command `node migrate.cjs`, `restart: "no"`), Service `app` mit `depends_on: migrate: condition: service_completed_successfully`. Gemeinsames Named Volume `listomat-data` für `/app/data`. `NUXT_SESSION_PASSWORD` via ENV (Pflicht), Port via `APP_PORT`.
- Multi-Arch-Build: `npm run docker:build-push` → `docker buildx build --push --platform linux/amd64,linux/arm64 -t registry.alexi.ch/listomat:latest`.

## Kubernetes-Deployment (kube001.alexi.ch)

Ziel: das bestehende Prod-Image `registry.alexi.ch/listomat:latest` als eigener Dienst im single-node microk8s-Cluster `kube001` betreiben. Manifests liegen unter `docs/kubernetes/kube001.alexi.ch/`.

### Cluster-Gegebenheiten (per read-only kubectl ermittelt)

- Single Node, Hostname `kube001`.
- Ingress-Controller: `ingressClassName: public`; TLS via cert-manager `ClusterIssuer` `lets-encrypt-alexi-ch` (Secret wird automatisch angelegt).
- Einzige StorageClass: `microk8s-hostpath` (default, Provisioner `microk8s.io/hostpath`, ReclaimPolicy Delete). **Nicht** verwendet – stattdessen manuell provisioniertes lokales PV (siehe unten), analog zum bestehenden Dienst `registry`.
- Privates Registry-Image: Pods brauchen `imagePullSecrets: registry-alexich-cred` (Typ `dockerconfigjson`). Dieses Secret existiert nur in fremden Namespaces und muss im Namespace `listomat` neu angelegt werden.
- Vorbild-Dienst `wichtelomat`: Deployment + ClusterIP-Service (Port 80 → benannter Port `http`) + Ingress mit cert-manager-Annotation. **Abweichung Listomat:** Container lauscht auf **3000** (Dockerfile `PORT=3000`), nicht 80.

### Storage

- Host-Verzeichnis (existiert bereits, leer): `/data/microk8s-storage/listomat-data` (der im Auftrag genannte Name `listomad-data` war ein Tippfehler; bestätigt auf `listomat-data`).
- Manuell provisioniertes `PersistentVolume` (Muster wie `registry-data`):
  - `spec.local.path: /data/microk8s-storage/listomat-data`
  - `accessModes: [ReadWriteOnce]`, `persistentVolumeReclaimPolicy: Retain`, `volumeMode: Filesystem`
  - `storageClassName: ""` (verhindert dynamisches Provisioning durch die Default-StorageClass)
  - `nodeAffinity` → `kubernetes.io/hostname In [kube001]`
  - `capacity.storage`: **Vorschlag 2Gi** (bei `local`/hostpath rein nominell, nicht erzwungen).
- Passendes `PersistentVolumeClaim` im Namespace `listomat`: `storageClassName: ""`, `volumeName: listomat-data`, `accessModes: [ReadWriteOnce]`, `requests.storage: 2Gi`. Gemountet in Init- und App-Container unter `/app/data`.

### Migration + Seed

- Wie bei Docker Compose: **Migration als initContainer** (gleiches Image, Command `node migrate.cjs`), der das PVC unter `/app/data` mountet und vor dem App-Container läuft.
- `migrate.cjs` (aus `server/db/migrate.ts`) führt **Migrationen und Admin-Seed** aus; `seedAdmin` ist idempotent (überspringt, wenn `admin@local` existiert). Es ist daher **keine Image-Anpassung** für den Admin-Seed nötig – der gewünschte «Auch Admin-Seed» ist bereits durch den Migrations-initContainer abgedeckt.
- `DB_URL` kommt als Image-Default (`file:/app/data/listomat.db`) und gilt für Init- wie App-Container.
- **Sicherheitshinweis:** Der Seed legt `admin@local` / `admin` an. Passwort nach erstem Login in Prod ändern.

### Secrets (committed mit Platzhaltern)

Beide Secrets werden als YAML im Repo abgelegt, mit klar markierten Platzhalter-Werten zum Ausfüllen (kein echter Wert im Git):

1. `registry-alexich-cred` (Typ `kubernetes.io/dockerconfigjson`): Kopie des Registry-Pull-Secrets für den Namespace `listomat`. Platzhalter für `.dockerconfigjson`; Erzeugung z.B. via
   `kubectl create secret docker-registry registry-alexich-cred --docker-server=registry.alexi.ch --docker-username=<user> --docker-password=<pw> -n listomat --dry-run=client -o yaml`.
2. `listomat-env` (Typ `Opaque`): **ein** Env-Secret mit allen App-Umgebungsvariablen, per `envFrom.secretRef` in **beide** Container (Migrations-initContainer und App) injiziert. Enthält:
   - `NUXT_SESSION_PASSWORD` – **mindestens 32 Zeichen** (Anforderung nuxt-auth-utils), Pflicht.
   - `DB_URL` – `file:/app/data/listomat.db` (identisch zum Image-Default; zentral hier definiert/überschreibbar).

   Im Code tatsächlich gelesene Env-Variablen (verifiziert): nur `DB_URL` (`server/db/index.ts`) und `NUXT_SESSION_PASSWORD` (nuxt-auth-utils). `NODE_ENV`/`HOST`/`PORT` sind Image-Defaults und bleiben dort.

### Manifests (Namensschema mit Reihenfolge-Präfix)

Ablage in `docs/kubernetes/kube001.alexi.ch/`:

| Datei | Inhalt |
| --- | --- |
| `00-namespace.yaml` | Namespace `listomat` |
| `10-pv.yaml` | PersistentVolume `listomat-data` (local, kube001) |
| `11-pvc.yaml` | PVC `listomat-data` im Namespace `listomat` |
| `20-secrets.yaml` | `registry-alexich-cred` + `listomat-env` (Platzhalter) |
| `30-deployment.yaml` | Deployment `listomat` (initContainer migrate + App) |
| `40-service.yaml` | ClusterIP-Service `listomat-service` |
| `50-ingress.yaml` | Ingress `listomat-ingress` (TLS, host listomat.alexi.ch) |

### Deployment-Details (`30-deployment.yaml`)

- `replicas: 1`, `strategy.type: Recreate` – bei RWO-Volume + single-node darf kein zweiter Pod parallel mounten (RollingUpdate würde blockieren).
- `imagePullSecrets: [registry-alexich-cred]`, Image `registry.alexi.ch/listomat:latest`, `imagePullPolicy: Always`.
- `initContainers: [migrate]` – Image wie oben, `command: ["node", "migrate.cjs"]`, `envFrom: [secretRef: listomat-env]`, VolumeMount `/app/data`.
- App-Container `listomat`: Port `containerPort: 3000` (Name `http`), VolumeMount `/app/data`, `envFrom: [secretRef: listomat-env]`.
- Volume: `persistentVolumeClaim: listomat-data`.
- **Ressourcen (Vorschlag, anpassbar):** requests `cpu: 50m`, `memory: 128Mi`; limits `cpu: 500m`, `memory: 512Mi` (Node/Nuxt-Runtime braucht mehr als die 128M von wichtelomat).
- **Probes (Vorschlag):** `readinessProbe` httpGet `/login` Port 3000; `livenessProbe` tcpSocket Port 3000. (Pfad/Details in der Umsetzung verifizieren.)

### Service & Ingress

- `40-service.yaml`: `type: ClusterIP`, Port `80` Name `http` → `targetPort: 3000`, Selector `app: listomat`.
- `50-ingress.yaml`: `ingressClassName: public`; Annotation `cert-manager.io/cluster-issuer: lets-encrypt-alexi-ch`; Rule host `listomat.alexi.ch`, Path `/` (Prefix) → Service `listomat-service` Port `http`; `tls` hosts `[listomat.alexi.ch]` Secret `listomat-ingress-tls` (von cert-manager befüllt).

### Offene Punkte / Annahmen zur Freigabe

- PV-Kapazität 2Gi, Ressourcen-Limits und Probe-Pfad sind Vorschläge – vor/bei Umsetzung bestätigen.
- Voraussetzung im Cluster (Schreib-Operationen, nicht durch diese Manifests abgedeckt bzw. Platzhalter): echte Werte für beide Secrets eintragen; DNS `listomat.alexi.ch` → Cluster-Ingress.

## Etappen

Pro Etappe: umsetzen, dann stoppen. Der Entwickler prüft manuell anhand der Prüfpunkte und gibt frei.

**E1 – Projekt-Setup** *(erledigt; ursprünglich mit PrimeVue, siehe E3b)*
nuxi init, Git, Dependencies (@nuxtjs/i18n, drizzle-orm, drizzle-kit, @libsql/client, uuidv7, bcrypt, nuxt-auth-utils, vue-draggable-plus), Ordnerstruktur, i18n-Grundgerüst (de/en), Basis-Layout mit Menü.
Prüfpunkte: `npm run dev` läuft, Sprachumschaltung wirkt.

**E2 – Schema, Migrationen, Seed** *(erledigt)*
schema.ts wie oben, drizzle.config, erste Migration generieren + ausführen, Seed-Script.
Prüfpunkte: `data/listomat.db` entsteht, Tabellen vorhanden, Admin-User in DB.

**E3 – Auth** *(erledigt)*
Login/Logout/me-Routen, Session, Login-Seite, globale Middleware, requireUser/requireAdmin.
Prüfpunkte: Login mit admin/admin funktioniert, geschützte Seite leitet ohne Session auf /login um, Logout wirkt.

**E3b – PrimeVue-Ausbau (Migration)** *(erledigt)*
E1–E3 wurden mit PrimeVue gebaut; PrimeVue wird jetzt entfernt. Vorgehen in dieser Reihenfolge:
1. Inventar: `grep -ri "primevue\|primeicons\|p-" app/ nuxt.config.ts` – alle Verwendungen auflisten (Komponenten, Icon-Klassen, Theme).
2. Dependencies entfernen: `npm remove primevue primeicons` sowie ggf. `@primevue/nuxt-module` bzw. `@primevue/themes` (alles entfernen, was im `package.json` zu PrimeVue gehört).
3. `nuxt.config.ts`: PrimeVue-Modul, Theme-/CSS-Einträge entfernen; stattdessen `css: ['~/assets/css/main.css']`.
4. UI-Basis gemäss Abschnitt «UI-Basis (Eigenbau)» erstellen: `main.css`, `UiModal`, `UiConfirm`, `UiToasts`, `UiProgress`, `useToast`, `useConfirm`. `UiToasts` und `UiConfirm` im Default-Layout einbinden.
5. Bestehende Stellen umbauen: Basis-Layout/Menü, Login-Seite (Formular mit `.form-field`, `.btn-primary`), Fehleranzeige beim Login auf `useToast` umstellen. Alle `<Prime*>`/`<p-*>`-Komponenten und `pi pi-*`-Icon-Klassen ersetzen.
6. `node_modules` prüfen: `npm ls | grep -i prime` leer.

Prüfpunkte: `grep -ri primevue app/ server/ nuxt.config.ts package.json` liefert nichts; `npm run dev` läuft ohne Fehler; Login/Logout funktionieren unverändert; fehlgeschlagener Login zeigt Toast; Sprachumschaltung wirkt; Redirect-Verhalten aus E3 unverändert.

**E4 – Admin-Userverwaltung + Impersonation** *(erledigt)*
Admin-Routen + Admin-Seite, Impersonation inkl. Banner.
Prüfpunkte: User anlegen, bearbeiten, deaktivieren (Login dann unmöglich), Passwort setzen, impersonate + zurück.

**E5 – Vorlagen-Verwaltung** *(erledigt; zusätzlich globale API-Auth-Middleware, siehe Entscheide «API-Security»)*
Template-Routen + Seite, CRUD Gruppen/Einträge, DnD-Sortierung, Neunummerierung.
Prüfpunkte: Vorlagen-CRUD komplett, Sortierung überlebt Reload, fremde Vorlagen unsichtbar (mit 2. User testen).

**E6 – Listen: Übersicht + CRUD** *(erledigt)*
GET/POST/PATCH/DELETE /api/lists, Übersichtsseite mit Kacheln + Fortschritt, Liste anlegen (öffnet direkt Detail), löschen mit Bestätigung.
Prüfpunkte: Liste anlegen/umbenennen/löschen, Kachel zeigt Fortschritt 0/0.

**E7 – Listen-Detail** *(erledigt)*
Gruppen/Einträge-CRUD in der Liste, done-Checkbox, Kommentare, DnD (Gruppen, Einträge inkl. gruppenübergreifend), Fortschritt, Reset, Duplizieren, Vorlage→Liste und Liste→Vorlage.
Prüfpunkte: kompletter Packlisten-Workflow durchspielbar; Eintrag in andere Gruppe ziehen; Duplikat hat Kommentare, aber keine Haken.

**E8 – Freigaben** *(erledigt)*
Share-Routen, Teilen-Dialog, geteilte Listen in Übersicht, Rechteprüfung (Shared darf nicht umbenennen/löschen/teilen, darf aber Gruppen/Einträge verwalten und duplizieren).
Prüfpunkte: mit 2 Usern testen; unbekannte E-Mail → Fehler; Freigabe entfernen wirkt.

**E9 – Export** *(erledigt)*
PDF- und Excel-Route, Export-Dialog.
Prüfpunkte: beide Formate mit status=current und status=empty; PDF zweispaltig, Gruppen nicht umbrochen; Excel formatiert.

**E10 – Eintrags-Anzahl** *(vor Docker eingeschoben, siehe Entscheide «E10 – Eintrags-Anzahl»)*
Schema-Feld `entries.quantity` (nullable int) + Migration; `optionalInt` in validate.ts; PATCH-Routen für Vorlagen- und Listen-Einträge um `quantity` erweitern; Kopierlogik kopiert `quantity` mit; Nummern-Feld im Eintrag (Listen-Detail und Vorlagen-Seite, zwischen Name und Kommentar); Export PDF (Präfix «5×») und Excel (Spalte «Anzahl»).
Prüfpunkte: Anzahl setzen/ändern/löschen (leer) auf Vorlagen- und Listen-Einträgen, überlebt Reload; 0 wird angezeigt; Kopieren (Vorlage→Liste, Liste→Vorlage, Duplizieren) übernimmt die Anzahl; PDF und Excel zeigen die Anzahl gemäss Layout; bestehende Einträge (Migration) ohne Anzahl.

**E11 – Docker** *(ehemals E10; umgesetzt, Freigabe durch manuellen Test ausstehend)*
Prod-Dockerfile (`docker/Dockerfile`), `docker-compose.prod.yml` mit Migrations-Init-Container, npm-Script `docker:build-push` (Multi-Arch amd64+arm64), `.dockerignore`. Details siehe Abschnitt «Docker».
Prüfpunkte: `npm run docker:build-push` baut beide Plattformen; `docker compose -f docker-compose.prod.yml up` auf leerem Volume → Migration + Seed laufen, App erreichbar, Login admin@local/admin, Daten überleben Neustart; Dev-Setup (`docker compose up`) funktioniert unverändert.

**E12 – Kubernetes-Deployment (kube001.alexi.ch)** *(Manifests erstellt, noch nicht angewendet; Freigabe/Deploy ausstehend)*
Manifests unter `docs/kubernetes/kube001.alexi.ch/` gemäss Abschnitt «Kubernetes-Deployment (kube001.alexi.ch)»: Namespace, lokales PV + PVC (`/data/microk8s-storage/listomat-data`), Secrets (Pull-Secret + Env-Secret `listomat-env`, Platzhalter), Deployment (Migrations-initContainer + App, Port 3000, `Recreate`), ClusterIP-Service, Ingress (`listomat.alexi.ch`, cert-manager `lets-encrypt-alexi-ch`).
Prüfpunkte: `kubectl apply` legt alle Objekte an; PVC bindet an das lokale PV; initContainer `migrate` läuft durch (Migration + Seed); App-Pod `Ready`; `https://listomat.alexi.ch` erreichbar mit gültigem Zertifikat; Login admin@local/admin; Daten überleben Pod-Neustart.
