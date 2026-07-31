# Entscheide

Ergänzungen und Präzisierungen zu `Planung.md`. Bei Widerspruch gilt dieses Dokument.

## Schema

- **Listen-Freigaben**: Feld `liste-id` (uuidv7, fk) ergänzen. Freigabe gilt pro Liste, nicht pauschal pro User.
- **Eintrag**: Feld `kommentar` (string, nullable) ergänzen.
- **Benutzer**: Feld `rolle` als Enum (`admin`, `user`) ergänzen.
- **Gruppe** `orig-gruppe-id`: reine Info/Referenz, kein späterer Abgleich mit der Vorlage.
- **Eintrag** `user-id`: reine Info (Ersteller), keine Rechte-Relevanz. Bei geteilten Listen ist der Ersteller ggf. nicht der Listen-Besitzer.
- **Session-Tokens**: Entität entfällt (siehe Auth).

## Auth

- **nuxt-auth-utils** mit serverseitigen Sessions (versiegelte httpOnly-Cookies). Kein JWT, keine Refresh-Tokens, keine Token-Tabelle.
- Passwort-Hashing: bcrypt (gemäss Plan).
- Keine Selbstregistrierung: User werden nur durch Admin angelegt.
- Passwort-Reset nur durch Admin (Passwort manuell setzen). Kein E-Mail-Versand, kein SMTP.
- **Impersonation**: Admin wechselt auf anderen User; Original-User-Id wird in der Session gespeichert, damit Rückwechsel zum Admin möglich ist.

## Freigaben

- Geteilte User dürfen Gruppen und Einträge der Liste verwalten (erstellen, bearbeiten, löschen, sortieren).
- Geteilte User dürfen **nicht**: Liste umbenennen, Liste löschen, Liste weiterteilen.
- Freigabe durch Eingabe der exakten E-Mail-Adresse. Keine User-Suche/Autocomplete.
- Kein Live-Sync bei gleichzeitiger Bearbeitung. Last-write-wins; Überspeichern wird in Kauf genommen.

## Tech-Stack

- **Nuxt**: neueste LTS-taugliche Version, Node LTS.
- **ORM**: Drizzle (drizzle-orm + drizzle-kit für Migrationen), SQLite serverseitig.
- **UI**: ~~PrimeVue~~ **Revidiert (nach E3)**: PrimeVue wird entfernt (lizenzpflichtig ab v5). Eigenes UI mit Standard-HTML/CSS/JS, siehe Abschnitt «UI-Eigenbau».
- **i18n**: Deutsch und Englisch mit vue-i18n (`@nuxtjs/i18n`).
- **Docker**: Compose-Projekt mit App-Container und Init-Container für DB-Migrationen (gemäss Plan).

## UI-Eigenbau (Entscheid nach E3)

- PrimeVue und primeicons werden vollständig entfernt (Dependencies, Nuxt-Modul, Theme, alle Komponenten-Verwendungen).
- Ersatz: eigene, minimale UI-Basis:
  - Globales Stylesheet mit CSS Custom Properties (Design-Tokens) und Basis-Styles für Buttons, Inputs, Karten, Tabellen.
  - Dialoge über das native `<dialog>`-Element.
  - Eigenes Toast-System (Composable + Container-Komponente im Layout).
  - Icons als wenige inline SVGs, keine Icon-Library.
- Keine CSS-Frameworks (kein Tailwind, kein Bootstrap). Kein zusätzliches npm-Paket für UI.
- `vue-draggable-plus` bleibt für Drag'n'drop (unabhängig von PrimeVue).

### Icons

- Inline-SVGs werden in eigenständige Vue-Komponenten unter `app/assets/icons/` extrahiert (je ein Icon pro Datei, PascalCase: `Plus.vue`, `Trash.vue`, `DragHandle.vue`, `Duplicate.vue`, `Edit.vue`, `EditUser.vue`, `Reset.vue`, `Export.vue`, `Share.vue`, `Bookmark.vue`, `Ban.vue`, `Check.vue`, `Key.vue`, `User.vue`).
- Konsistente Attribute: `viewBox="0 0 24 24"`, `fill="none"`, `stroke="currentColor"`, `stroke-width="2"`. Stroke-Linienenden werden pro Icon so übernommen, wie sie vorher inline definiert waren.
- Jede Icon-Komponente akzeptiert die Props `width` und `height` (Number, Default 24). Konsumenten setzen `:width="16" :height="16"` an Stellen, wo das Icon neben Text in einem Toolbar-Button sitzt.
- Verwendet werden die Komponenten per explizitem Import im jeweiligen `<script setup>` (kein Wrapper, kein globales Auto-Import aus `app/components/`). Dadurch ergibt sich Tree-Shaking und der Aufruf-Site-Typ passt zu den Vue-Standards.
- Keine zusätzliche Library, keine `UiIcon`-Abstraktionsschicht.

## Export

- **PDF**: serverseitig mit leichtgewichtiger PDF-Library (pdfkit o.ä., kein Puppeteer/Chromium). Layout wird eigenständig gestaltet, keine 1:1-HTML-Abbildung. Sortierung wie in der Oberfläche.
- **Excel**: exceljs, mit Formatierung (Titel, Gruppenüberschriften). CSV reicht nicht.

## Vorlagen

- Eine Listen-Gruppe kann direkt aus dem Listenmodul heraus als Vorlage gespeichert werden.
- Vorlagen-Einträge haben ebenfalls Kommentare; beim Kopieren (in beide Richtungen) werden Kommentare mitkopiert.
- Jeder User sieht nur seine eigenen Vorlagen – auch in geteilten Listen.

## Listen-UI

- **Reset-Funktion**: alle Erledigt-Haken einer Liste zurücksetzen.
- **Duplizieren-Funktion**: Liste inkl. aller Gruppen und Einträge kopieren.
- **Fortschritt** wird angezeigt (erledigt/total).
- Löschen: Gruppe mit Bestätigungsdialog, Eintrag ohne. Kein Undo.
- **Implizites Speichern**: jede Änderung (blur bei contenteditable, Checkbox-Klick, Drag'n'drop) löst sofort einen API-Call aus. Kein Speichern-Button.
- Listen-Kacheln zeigen Bezeichnung + Fortschritt.

## Sortierung

- `reihenfolge` als Integer, Neunummerierung der betroffenen Gruppe/Liste beim Verschieben.

## Layout

- Zwei Layouts via CSS Flexbox/Grid + Media Query: Mobile einspaltig, ab Tablet zweispaltig.

## Seed

- Initial-Admin per Seed mit fixem Passwort `admin`.

## Duplizieren

- Kopiert alle Gruppen und Einträge inkl. Kommentare; Erledigt-Haken werden zurückgesetzt.
- Auch geteilte User dürfen eine geteilte Liste duplizieren; die Kopie gehört ihnen.

## Export (Details)

- Kommentare werden ausgegeben.
- Erledigt-Status wahlweise: Export mit aktuellem Status oder leer (zum manuellen Abhaken). Wahl beim Export-Dialog.
- Auslösung über Download-Buttons in der Listen-Ansicht, Generierung serverseitig via API-Route.

## i18n (Details)

- Default Deutsch, Sprachwahl via Browser-Detection/lokal. Keine Speicherung in der DB.

## Projekt

- Keine Tests.
- API: Nuxt-Server-Routes unter `server/api/` mit REST-Konventionen.
- Keine Validierungslib; eigene minimale zentrale Validierungsfunktionen.
- Grüne Wiese: `git init`, `nuxi init`.

## API-Security

- Globale Server-Middleware (`server/middleware/auth.ts`): alle `/api/*`-Routen erfordern eine gültige Session; public sind nur `/api/auth/login` und `/api/auth/logout`.
- Die per-Route-Checks (`requireUser`/`requireAdmin`) bleiben zusätzlich bestehen (Defense-in-Depth, liefern das User-Objekt).

## E6 – Listenübersicht

- Umbenennen einer Liste erfolgt direkt auf der Kachel: Name als contenteditable mit Stift-Icon (Icon fokussiert/selektiert den Namen). Kein Detail-Stub in E6; «Klick öffnet Detail» kommt mit E7.
- `POST /api/lists`: Der Client sendet den Default-Namen via i18n im Body (`{ name }`, analog Gruppen-Default); der Server akzeptiert ihn als optionalen String mit Fallback «Neue Liste».
- Sortierung der Kacheln: nach `updatedAt` absteigend (eigene und geteilte je separat).
- Abschnitt «Mit mir geteilt» wird nur angezeigt, wenn geteilte Listen vorhanden sind.
- `GET /api/lists/:id` wird erst mit E7 (Listen-Detail) implementiert.

## E7 – Listen-Detail

- Gruppe hinzufügen: Plus-Button öffnet einen kleinen Dialog (UiModal) mit zwei Wegen: Bezeichnung eingeben → neue leere Gruppe, oder eigene Vorlage aus Select-Dropdown wählen → Vorlage einfügen.
- Umbenennen von Liste, Gruppen und Eintragsnamen jeweils via contenteditable; Kommentare bleiben Input-Felder. Gilt auch für die Vorlagen-Seite (Eintragsname dort von Input auf contenteditable umgestellt).
- Nach «Duplizieren» (Detail und Übersichts-Kachel) wird zur Kopie navigiert. Den Kopie-Namen sendet der Client via i18n („… (Kopie)“); Server-Fallback identisch (analog Default-Name E6).
- «Anlegen öffnet direkt Detail» ist nun aktiv; die E6-Übergangslösung (Fokus auf Kachel-Titel) ist ersetzt. Kachel-Klick öffnet das Detail (ausser auf Buttons/contenteditable).
- «Als Vorlage speichern» verändert die Liste nicht → kein updatedAt-Touch; Erfolg wird per Toast bestätigt.
- Duplizieren-Aktion auch auf den Übersichts-Kacheln (eigene und geteilte, gemäss UI-Spez).
- Export- und Teilen-Buttons in der Detail-Toolbar folgen mit E9 bzw. E8.

## E8 – Freigaben

- `POST /api/lists/:id/reset`: Zugriff bleibt Owner oder Shared (`requireListAccess`), wie bereits in E7 umgesetzt. Die Spec-Tabelle nennt hier keine explizite Einschränkung (anders als PATCH/DELETE „nur Owner“ bzw. duplicate „Owner oder Shared“); bestätigt.
- Freigabe entfernen: keine Bestätigungsdialog nötig (analog Eintrag löschen), da reversibel (erneut teilen möglich).
- E-Mail-Abgleich beim Teilen: lowercase + trim (wie Login), unbekannt/inaktiv → 404 ohne Unterscheidung (kein Existenz-Leak).

## E9 – Export

- Zugriff `GET /api/lists/:id/export/pdf|xlsx`: Owner oder Shared (`requireListAccess`), bestätigt (Spec-Tabelle ohne Rechte-Vermerk).
- `?status` ist Pflichtparameter (400 bei Fehlen/ungültigem Wert); kein Default, da die Spec keinen nennt.
- PDF: Kommentar steht unter dem Eintragsnamen (nicht daneben) – bessere Breitenausnutzung, einheitliche Höhenberechnung.
- PDF-Kopf (Titel + Exportdatum) erscheint nur auf Seite 1; Folgeseiten beginnen direkt mit Spalteninhalt.
- "Länger als eine ganze Spalte" wird konservativ anhand der kleineren Spaltenhöhe (Seite 1, nach Kopf) geprüft; das kann in Einzelfällen eine Gruppe entry-weise umbrechen, die in einer leeren Spalte auf Folgeseiten knapp gepasst hätte – sicherer als Überlauf.
- Beim entry-weisen Umbruch einer übergrossen Gruppe wird der Gruppentitel bei Spalten-/Seitenwechsel nicht wiederholt (kein "Fortsetzung"-Label).
- Export-Dialog: Radiobuttons für Format (PDF/Excel) und Status (aktuell/leer), Download via Klick auf unsichtbaren Link (Browser sendet Session-Cookie automatisch, kein Blob/fetch nötig). Sichtbar für Owner und Shared.
- Dateiname: `Content-Disposition` mit ASCII-Fallback plus `filename*=UTF-8''…` für Umlaute/Sonderzeichen; verbotene Dateisystem-Zeichen werden ersetzt.

## Testrunde E1–E10 (Juli 2026)

- Sprachwahl: explizite Anwahl im Sprache-Menu wird im localStorage (`listomat.locale`) gespeichert und beim App-Start wiederhergestellt.
- Neuer Eintrag (Vorlagen und Listen-Detail): wird auch beim Verlassen des Eingabefelds (Blur) gespeichert, nicht nur mit Enter.
- «Als Vorlage speichern»: Name wird im Dialog abgefragt (Default: Gruppenname). Ist der Name unter den Vorlagen des Users bereits vergeben, wird serverseitig «Name (2)», «Name (3)», … verwendet.

## E10 – Eintrags-Anzahl (Juli 2026)

- **Schema**: Eintrag erhält Feld `quantity` (integer, nullable). Gilt für Vorlagen- und Listen-Einträge.
- **Wertebereich**: nullable, min. 0. Leer = keine Anzahl (null); 0 ist ein gültiger Wert und wird angezeigt. Ganze Zahlen, keine Obergrenze ausser Validierungslimit (max. 999999).
- **UI**: schmales Nummern-Feld (`<input type="number">`) zwischen Eintragsname und Kommentar-Feld, immer sichtbar, implizites Speichern bei blur/change (analog Kommentar). Gilt für Listen-Detail und Vorlagen-Seite.
- **UI-Präzisierung Listen-Detail (nach erstem Test)**: Eintragsname und Anzahl nebeneinander in einer Zeile (Name nimmt die Restbreite), Kommentar darunter. Anzahl-Feld ca. 2 Ziffern breit, rechtsbündig, Placeholder «0», Browser-Spinbuttons ausgeblendet.
- **Neuanlage**: das «Neuer Eintrag»-Feld am Gruppenende erhält kein Anzahl-Feld; neue Einträge werden ohne Anzahl angelegt, die Anzahl wird danach am Eintrag gesetzt.
- **Kopierlogik**: `quantity` wird bei allen Kopiervorgängen mitkopiert (Vorlage→Liste, Liste→Vorlage, Duplizieren) – analog Kommentar.
- **Export PDF**: Anzahl als Präfix vor dem Eintragsnamen («5× Socken»); ohne Anzahl nur der Name.
- **Export Excel**: eigene Spalte «Anzahl» zwischen «Erledigt» und «Bezeichnung» (neu 4 Spalten: Erledigt, Anzahl, Bezeichnung, Kommentar).
- **Etappen**: Umsetzung als E10 vor Docker eingeschoben; Docker wird E11.

## E11 – Docker (Juli 2026)

- **Prod-Image**: Multi-Stage `docker/Dockerfile` (node:24-slim für Build und Runtime, konsistent mit Dev statt `lts-slim`). Runtime enthält `.output/`, `drizzle/`, `/app/migrate.cjs` und das prod-`node_modules` (`npm prune --omit=dev`); kein drizzle-kit/tsx im Image. Rein bauzeitliche Pakete (`nuxt`, `@nuxtjs/i18n`, `vue`, `vue-router`, `vue-draggable-plus`) stehen in `devDependencies` und fallen beim Prune raus.
- **libsql-Binding / Runtime-Deps** *(revidiert bei E12/K8s)*: `libsql` lädt sein natives Binding (`@libsql/linux-<arch>-gnu`) per dynamischem `require`, das Nitros Tracer nicht erkennt; zudem legt Nitro von `@libsql/*`/`js-base64` nur ESM-Teilkopien nach `.output/server/node_modules`. Statt einzelne Pakete manuell zu kopieren wird das vollständige prod-`node_modules` als `/app/node_modules` ins Runtime-Image übernommen; Node löst native Binding und `--external`-Deps per Upward-Resolution von dort auf.
- **Migration + Seed** *(revidiert bei E12/K8s)*: eigenes CLI `server/db/migrate.ts` (drizzle-orm-Migrator statt drizzle-kit), im Build-Stage per esbuild nach **`/app/migrate.cjs`** gebündelt (oberste Ebene, nicht unter `.output/server/`, damit Nitros ESM-Teilkopien es nicht überschatten; `bcrypt`/`@libsql/client` extern → aus `/app/node_modules`). Command `node migrate.cjs`. Seed-Logik nach `server/db/seed-admin.ts` extrahiert; `seed.ts` (Dev-CLI via tsx) und `migrate.ts` nutzen sie gemeinsam.
- **Compose Prod**: `docker-compose.prod.yml` mit Service `migrate` (gleiches Image, `restart: "no"`) und `app` (`depends_on: condition: service_completed_successfully`); gemeinsames Named Volume `listomat-data` → `/app/data`. `DB_URL`-Default (`file:/app/data/listomat.db`) ist im Image gesetzt; `NUXT_SESSION_PASSWORD` ist Pflicht-ENV.
- **Multi-Arch**: 1 Image für linux/amd64 + linux/arm64 via `docker buildx`; Image-Name `registry.alexi.ch/listomat:latest`. npm-Script `docker:build-push` baut und pusht direkt in die Registry (ursprünglich ohne `--push` geplant, vom Entwickler angepasst).
- **Dev-Setup**: `docker-compose.yml` + `docker/Dockerfile.dev` bleiben unverändert.

## Offen

- (wird laufend ergänzt)
