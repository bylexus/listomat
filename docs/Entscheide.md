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

## Offen

- (wird laufend ergänzt)
