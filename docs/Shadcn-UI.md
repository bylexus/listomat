# shadcn-vue Einführung

Arbeitsdokument für den Branch `shadcn-ui`. Hält Abklärungen, Erkenntnisse, offene Fragen
und (später) die getroffenen Entscheide fest.

Status: **Umgesetzt.** Entscheide E-S1 bis E-S16, keine offenen Fragen. Migration in einem Commit erfolgt (siehe Abschnitt 8).
Blockiert durch: Netzwerk-Freigabe für `shadcn-vue.com` (siehe E-S3).

---

## 1. Ausgangslage

- Nuxt 4.5, Vue 3.5, kein CSS-Framework, kein UI-Framework, keine Icon-Library.
- Eigenbau-UI: `app/assets/css/main.css` (202 Zeilen, CSS-Custom-Properties + Utility-Klassen
  `.btn`, `.card`, `.form-field`, `.toolbar`) plus vier Komponenten unter `app/components/ui/`
  (`UiModal`, `UiConfirm`, `UiToasts`, `UiProgress`) und zwei Composables (`useToast`, `useConfirm`).
- PrimeVue wurde in Etappe E3b bewusst wieder ausgebaut (Lizenz-Banner ab v5).
- `CLAUDE.md` hält als **nicht verhandelbare** Arbeitsregel fest:
  *«Kein UI-Framework, kein CSS-Framework, keine Icon-Library. Eigenbau-UI»* und
  *«Keine zusätzlichen Dependencies ohne Rückfrage. Minimalismus vor Komfort.»*

Die Einführung von shadcn-vue widerspricht dieser Regel direkt. Sie muss vor der Umsetzung
in `docs/Entscheide.md` und `CLAUDE.md` revidiert werden (siehe offene Frage F1).

## 2. Was shadcn-vue ist

`https://ui.shadcn.com/` ist die **React**-Variante. Für Vue existiert der von *unovue*
gepflegte Port **shadcn-vue** (`https://www.shadcn-vue.com/`) mit dem Nuxt-Modul `shadcn-nuxt`.
Beide sind nicht offiziell von shadcn selbst.

shadcn-vue ist keine Komponenten-Bibliothek im klassischen Sinn: Ein CLI kopiert den
Quellcode der Komponenten als `.vue`-Dateien ins Projekt (`app/components/ui/<name>/`).
Der Code gehört danach dem Projekt und wird von Hand gepflegt – es gibt keine Update-Automatik.

**Laufzeit-Abhängigkeiten sind dennoch nötig** (Stand 2026-07-27):

| Paket | Version | Zweck | Pflicht? |
|---|---|---|---|
| `tailwindcss` + `@tailwindcss/vite` | 4.3.3 | Styling-Basis, ohne die shadcn nicht funktioniert | ja |
| `shadcn-nuxt` | 2.8.0 | Nuxt-Modul, nur Auto-Import-Registrierung | faktisch ja |
| `reka-ui` | 2.10.1 | Headless-Primitives (Ex-`radix-vue`), Basis fast aller Komponenten | ja, ausser bei rein visuellen Komponenten |
| `clsx` + `tailwind-merge` | 2.1.1 / 3.6.0 | `cn()`-Helper | ja |
| `class-variance-authority` | 0.7.1 | Varianten (`variant`, `size`) | ja |
| `tw-animate-css` | 1.4.0 | Animationen von Dialog/Popover/Sheet | praktisch ja |
| `@lucide/vue` | 1.27.0 | Icons (Doku-Beispiele nutzen sie durchgehend) | nein, aber Doku setzt sie voraus |
| `@vueuse/core` | 14.3.0 | `provideSSRWidth` für einzelne Komponenten | nur bei Bedarf |

Realistisch: **6–8 neue Dependencies**. Das ist die zentrale Abwägung gegenüber der bisherigen
Projektlinie.

## 3. Integration ins bestehende Projekt – verifiziert

In einer Wegwerf-Kopie des Repos (`probe-app`, nicht committet) wurde die Integration bis vor
den CLI-`init` durchgespielt. Ergebnisse:

1. `npm i -D tailwindcss @tailwindcss/vite shadcn-nuxt` – konfliktfrei, 26 Pakete zusätzlich.
2. `app/assets/css/tailwind.css` mit `@import "tailwindcss";`.
3. `nuxt.config.ts`:
   ```ts
   import tailwindcss from '@tailwindcss/vite'

   export default defineNuxtConfig({
     modules: ['@nuxtjs/i18n', 'nuxt-auth-utils', 'shadcn-nuxt'],
     vite: { plugins: [tailwindcss()] },
     shadcn: { prefix: '<offen>', componentDir: '@/components/ui' },
     css: ['~/assets/css/tailwind.css', '~/assets/css/main.css']
   })
   ```
4. `npx nuxi prepare` – ok.
5. `npm run build` – **erfolgreich**, Tailwind-Layer landen korrekt im Bundle.
6. `npx shadcn-vue@latest init` – Preflight, Framework-Erkennung («Found Nuxt 4») und
   Tailwind-Erkennung («Found v4») laufen sauber durch.

### Blocker in dieser Sandbox

Der CLI-Schritt bricht danach ab: `Failed to fetch from registry: https://shadcn-vue.com/r/...`.
Die Sandbox erlaubt nur eine feste Domain-Liste; `shadcn-vue.com` gehört nicht dazu
(`x-deny-reason: host_not_allowed`). npm-Registry ist erreichbar, die Komponenten-Registry nicht.

Konsequenz – drei Wege (siehe offene Frage F5):
- **a)** Domain `shadcn-vue.com` in den Netzwerk-Einstellungen freigeben, dann läuft das CLI hier.
- **b)** Der Entwickler führt `shadcn-vue init` / `add …` lokal aus und pusht das Resultat.
- **c)** Komponenten von Hand aus der Doku übernehmen – fehleranfällig, nicht empfohlen.

### Kollision `main.css` ↔ Tailwind (verifiziert)

Tailwind v4 legt sein gesamtes CSS in Cascade-Layers (`@layer theme, base, components, utilities`).
`main.css` ist ungelayert und wird nach Tailwind geladen. **Ungelayertes CSS schlägt gelayertes
CSS unabhängig von der Spezifität.** Im Build-Output bestätigt.

Praktische Folge: Solange `main.css` in heutiger Form geladen wird, überschreiben deren
Element-Selektoren (`input`, `select`, `textarea`, `table th/td`, `body`) und Klassen
(`.btn`, `.card`) **jede** Tailwind-Utility – auch die in den shadcn-Komponenten. shadcn-Inputs
und -Buttons würden falsch aussehen.

Mögliche Auflösungen (siehe offene Frage F3):
- `main.css` in `@layer` einwickeln,
- oder `main.css` bei der Migration schrittweise abbauen,
- oder harter Schnitt: `main.css` sofort entfernen und alles auf einmal migrieren.

### 3a. Alternativer Bezugsweg über GitHub (verifiziert)

`github.com` und `codeload.github.com` stehen auf der Allowlist der Sandbox. Ein flacher Klon von
`unovue/shadcn-vue` gelingt und enthält vollständig, was das CLI sonst über die Registry lädt:

- `apps/v4/registry/new-york-v4/ui/<name>/` – Komponentenquellen (66 Komponenten)
- `apps/v4/public/r/index.json` – Registry-Index mit `dependencies` und `registryDependencies` je Komponente
- `apps/v4/registry/new-york-v4/lib/utils.ts` – `cn()`-Helper
- `apps/v4/registry/base-colors.ts`, `apps/v4/public/r/themes.css` – Theme-Tokens inkl. Slate

Damit lässt sich das CLI vollständig nachbilden. `components.json` wird von Hand geschrieben,
damit ein späteres `shadcn-vue add` auf dem Entwicklerrechner weiterhin funktioniert.
Nachteil: kein Versions-Pinning durch das CLI, der Klonstand ist manuell festzuhalten.

### Tatsächlicher Dependency-Bedarf für den geplanten Komponentensatz

Ermittelt aus `index.json` für `button`, `input`, `label`, `card`, `dialog`, `alert-dialog`,
`table`, `select`, `progress`, `field`, `empty`, `separator`:

`reka-ui`, `@vueuse/core`, `class-variance-authority`, `clsx`, `tailwind-merge`
(dazu `tailwindcss`, `@tailwindcss/vite`, `shadcn-nuxt`).

**Nicht** nötig – jeweils durch einen Entscheid ausgeschlossen: `@lucide/vue` (E-S8),
`vue-sonner` (E-S12), `@tanstack/vue-table` (E-S13).

Zu `@tanstack/vue-table`: Die `table`-Komponente deklariert es als Dependency, aber nur
`table/utils.ts` importiert daraus (`valueUpdater`-Helper für `DataTable`). Die eigentlichen
`Table*.vue` kommen ohne aus. Wird `utils.ts` weggelassen, entfällt die Dependency – passend zu E-S13.

### Namenskollision `app/components/ui/`

Der shadcn-Default `componentDir: '@/components/ui'` zeigt auf genau das Verzeichnis, in dem
bereits `UiModal.vue`, `UiConfirm.vue`, `UiToasts.vue`, `UiProgress.vue` liegen.
shadcn legt dort Unterordner an (`ui/button/Button.vue` etc.), der Default-Prefix ist `Ui`,
also `<UiButton>` – nahe an den bestehenden `Ui*`-Namen. Muss geklärt werden (F4).

## 4. Inventar: Was liesse sich ersetzen?

Gezählt über `app/pages/`, `app/layouts/`, `app/components/ui/` (1'778 Zeilen Template/Script).

### Direkte Entsprechungen

| Heute | Vorkommen | shadcn-vue |
|---|---|---|
| `<button class="btn/btn-primary/btn-danger/btn-ghost">` | 30 Buttons, 62 Klassen-Treffer | `Button` (`variant`: default/destructive/ghost/outline) |
| `<input>` nativ | 13 | `Input` |
| `<select>` nativ | 3 | `Select` (Reka-basiert) oder `NativeSelect` |
| `.form-field` + `<label>` | 14 | `Field` / `Label` |
| `.card`, `.list-card`, `.group-card` | 6 + eigene | `Card` |
| `UiModal` (natives `<dialog>`, 81 Z.) | 5 Einsätze | `Dialog` |
| `UiConfirm` (25 Z.) | 1 | `AlertDialog` (+ `useConfirm` bleibt) |
| `UiToasts` (68 Z.) | 2 | `Sonner` – zieht `vue-sonner` als weitere Dependency nach |
| `UiProgress` (38 Z.) | 2 | `Progress` |
| `<table>` in `admin/users.vue` | 1 | `Table` (rein visuell) oder `DataTable` (zieht TanStack Table nach) |
| `.empty-state` | 7 | `Empty` |
| `.toolbar` | 5 | Tailwind-Utilities, keine Komponente nötig |

### Möglicher Mehrwert über Ersatz hinaus

- **Radio-Auswahl** (`.radio-option`/`.radio-row`, 6 Treffer) → `RadioGroup`, tastaturfähig.
- **`admin/users.vue`**: Sortierung/Filter via `DataTable` – nur sinnvoll, wenn Bedarf besteht.
- **`lists/[id].vue`** (721 Zeilen, grösste Datei): Export-Auswahl und Aktionen liessen sich
  in ein `DropdownMenu` bündeln.
- **Dark Mode**: shadcn bringt Token dafür mit; heute nicht vorhanden.
- Accessibility (Fokus-Trap, ARIA, Tastatur) ist bei `UiModal`/`UiConfirm` nur rudimentär.

### Ausdrücklich **nicht** ersetzen

- **Drag & Drop** über `vue-draggable-plus` in `templates.vue` und `lists/[id].vue`:
  shadcn hat kein Äquivalent. Die Drag-Handles sind eng mit dem Layout verwoben – höchstes
  Regressionsrisiko bei einer Migration.
- **`contenteditable`-Titel** (Gruppen, Listen): bewusster Eigenbau, kein shadcn-Pendant.
- **Inline-Edit-Muster** (Speichern bei `blur`): eigene Logik, unabhängig vom Styling.

## 5. Offene Fragen

| Nr. | Frage |
|---|---|
| ~~F1~~ | *geklärt → E-S1* |
| ~~F2~~ | *geklärt → E-S1* |
| ~~F3~~ | *geklärt → E-S2* |
| ~~F4~~ | *geklärt → E-S4, E-S9* |
| ~~F5~~ | *geklärt → E-S3* |
| ~~F6~~ | *geklärt → E-S6* |
| ~~F7~~ | *geklärt → E-S8* |
| ~~F8~~ | *geklärt → E-S12* |
| ~~F9~~ | *geklärt → E-S13* |
| ~~F10~~ | *geklärt → E-S10* |
| ~~F11~~ | *geklärt → E-S14* |
| ~~F12~~ | *geklärt → E-S7* |
| ~~F13~~ | *geklärt → E-S9* |
| ~~F14~~ | *geklärt → E-S11* (Toast-Seite hängt an F15) |
| ~~F15~~ | *geklärt → E-S15.* Ursprünglicher Widerspruch: E-S11 verlangt, `useToast.ts` zu löschen und pro Aufrufstelle auszubauen. E-S12 verlangt einen selbstgebauten Tailwind-Toast. Ein selbstgebauter Toast braucht aber genau das, was E-S11 streicht: einen gemeinsamen State und eine global gerenderte Overlay-Komponente. Bei 11 Aufrufstellen in 5 Seiten wäre eine Inline-Lösung 11-fach dupliziert. Auflösung nötig. |
| ~~F16~~ | *geklärt → E-S16.* Ursprünglicher Vorschlag: Die Registry-Domain bleibt gesperrt, aber `github.com` ist freigegeben – und das Quellrepo `unovue/shadcn-vue` enthält alles, was das CLI holen würde (siehe Abschnitt 3a). Soll ich die Komponenten von dort übernehmen statt auf die Domain-Freigabe zu warten? |

## 6. Entscheide

| Nr. | Entscheid | Datum |
|---|---|---|
| E-S1 | shadcn-vue wird eingeführt. Die Regel «Kein UI-Framework, kein CSS-Framework, keine Icon-Library» gilt für diesen Branch nicht mehr; Tailwind CSS v4 wird Styling-Basis. Bedingung: **`main` bleibt unangetastet**, die Arbeit findet ausschliesslich im Branch `shadcn-ui` statt. `CLAUDE.md` wird erst bei einem allfälligen Merge angepasst. | 2026-07-27 |
| E-S2 | `app/assets/css/main.css` wird **ersatzlos entfernt** (harter Schnitt). Kein `@layer`-Workaround, keine Koexistenz. Damit sind sämtliche Seiten und Layouts in einem Zug zu migrieren – Zwischenstände im Branch sind ungestylt und das ist akzeptiert. | 2026-07-27 |
| E-S3 | Die shadcn-Komponenten werden per offiziellem CLI (`shadcn-vue add …`) ins Repo geholt. Dazu wird `shadcn-vue.com` in den Netzwerk-Einstellungen der Sandbox freigegeben. | 2026-07-27 |
| E-S4 | shadcn-Komponenten kommen in ein **eigenes Verzeichnis** `app/components/shadcn/` (`componentDir: '@/components/shadcn'`). `app/components/ui/` bleibt den projekteigenen Komponenten vorbehalten. | 2026-07-27 |
| E-S5 | Basis-Farbe für `shadcn-vue init`: **Slate**. Die bisherige Primärfarbe `#2563eb` wird nicht übernommen; es gilt das shadcn-Standard-Theme. | 2026-07-27 |
| E-S6 | Die Migration erfolgt in **einem einzigen Commit** (Setup + Komponenten + alle Seiten/Layouts). Keine Zwischenstopps; die Prüfung erfolgt am Gesamtresultat. | 2026-07-27 |
| E-S7 | Auto-Import ohne Prefix: `shadcn: { prefix: '', componentDir: '@/components/shadcn' }` → `<Button>`, `<Dialog>`, `<Card>`. | 2026-07-27 |
| E-S8 | **Keine Icon-Dependency.** Die bestehenden Inline-SVGs bleiben im Markup; `@lucide/vue` wird nicht aufgenommen. | 2026-07-27 |
| E-S9 | `UiModal`, `UiConfirm`, `UiToasts`, `UiProgress` werden **ersatzlos gelöscht**, die Aufrufstellen auf shadcn-Komponenten umgebaut. | 2026-07-27 |
| E-S10 | **Kein Dark Mode.** Nur Light-Theme; kein `@nuxtjs/color-mode`, kein Klassen-Toggle. | 2026-07-27 |
| E-S11 | Die Composables `app/composables/useToast.ts` und `app/composables/useConfirm.ts` werden **ebenfalls gelöscht**. Bestätigungsdialoge werden pro Aufrufstelle als `AlertDialog` mit lokalem State ausgebaut (4 Stellen). *Für die Toast-Seite steht dieser Entscheid im Konflikt mit E-S12 – siehe F15.* | 2026-07-27 |
| E-S12 | **Kein shadcn-Toast, kein `vue-sonner`.** Das Toast-Rendering wird selbst mit Tailwind gebaut. | 2026-07-27 |
| E-S13 | `admin/users.vue` erhält die einfache, rein visuelle `Table`-Komponente. Kein `DataTable`, kein TanStack Table. | 2026-07-27 |
| E-S14 | Der Branch `shadcn-ui` ist ein **Experiment mit offenem Ausgang**. Ein Merge nach `main` ist nicht zugesichert; `main` und `CLAUDE.md` bleiben unangetastet. | 2026-07-27 |
| E-S16 | **Revision von E-S3.** Die Komponenten werden nicht per CLI, sondern direkt aus dem Quellrepo `unovue/shadcn-vue` übernommen (Klonstand siehe Abschnitt 8). `components.json` wird von Hand geschrieben, damit ein späteres `shadcn-vue add` lokal weiterhin funktioniert. | 2026-07-27 |
| E-S15 | Auflösung von F15: Für Toasts bleiben **ein Composable und eine global gerenderte Komponente** bestehen; nur das Rendering wird auf Tailwind umgestellt. E-S11 gilt damit **nur für `useConfirm`** – dieses wird gelöscht und die 4 Aufrufstellen als `AlertDialog` ausgebaut. | 2026-07-27 |

### Konsequenz aus E-S2

Der harte Schnitt betrifft alle bestehenden Klassen: `.btn`/`.btn-primary`/`.btn-danger`/`.btn-ghost`
(62 Treffer), `.card`, `.form-field`, `.toolbar`, `.empty-state` sowie alle globalen
Element-Regeln (`input`, `select`, `textarea`, `table`, `body`, `h1`/`h2`).
Zusätzlich verlieren die scoped Styles in den Seiten ihre Design-Tokens
(`--color-*`, `--space-*`, `--radius`, `--shadow`) – diese Custom Properties müssen entweder
auf Tailwind-Theme-Tokens gemappt oder die scoped Styles mitmigriert werden. Betrifft alle
fünf Seiten und beide Layouts.

## 7. Änderungsprotokoll

| Datum | Schritt |
|---|---|
| 2026-07-27 | Branch `shadcn-ui` erstellt; Abklärung Integration, Dependency-Footprint, Konflikte, UI-Inventar. Kein Produktivcode geändert. |
| 2026-07-27 | Entscheide E-S1 (shadcn-vue + Tailwind, nur im Branch), E-S2 (`main.css` harter Schnitt), E-S3 (CLI via freigegebene Domain) festgehalten. |
| 2026-07-27 | Entscheide E-S4 (eigenes Verzeichnis `app/components/shadcn/`), E-S5 (Basis-Farbe Slate), E-S6 (Migration in einem Commit) festgehalten. Domain-Freigabe steht noch aus, CLI daher noch nicht ausführbar. |
| 2026-07-27 | Entscheide E-S7 (kein Prefix), E-S8 (keine Icon-Library), E-S9 (Ui*-Komponenten löschen) festgehalten. Neue Folgefrage F14 (Composables). |
| 2026-07-27 | Entscheide E-S10 (kein Dark Mode), E-S11 (Composables löschen) festgehalten. F8 muss neu entschieden werden: shadcn-`Toast` ist deprecated. |
| 2026-07-27 | Entscheide E-S12 (eigener Tailwind-Toast), E-S13 (einfache Table), E-S14 (Experiment) festgehalten. Widerspruch E-S11 ↔ E-S12 als F15 erfasst. |
| 2026-07-27 | E-S15 löst F15. Alternativer Bezugsweg über GitHub verifiziert (Abschnitt 3a), als F16 zur Entscheidung gestellt. Dependency-Bedarf präzisiert. |
| 2026-07-27 | E-S16 gefällt. Migration umgesetzt und gebaut (Abschnitt 8). |

---

## 8. Umsetzung

Migration gemäss E-S6 in einem Commit. Quellstand der übernommenen Komponenten:
`unovue/shadcn-vue`, Commit `feb41b5c3fea0eecc6857896c870eff4480641c8` (2026-07-25).

### Neue Dependencies

Laufzeit: `reka-ui`, `@vueuse/core`, `class-variance-authority`, `clsx`, `tailwind-merge`.
Build: `tailwindcss`, `@tailwindcss/vite`, `tw-animate-css`, `shadcn-nuxt`.

Nicht aufgenommen: `@lucide/vue` (E-S8), `vue-sonner` (E-S12), `@tanstack/vue-table` (E-S13).

### Neue Dateien

- `app/assets/css/tailwind.css` – Tailwind-Import, Slate-Tokens (nur Light), Basis-Layer
- `app/lib/utils.ts` – `cn()`
- `app/components/shadcn/` – 16 Komponenten: `alert-dialog`, `badge`, `button`, `card`,
  `checkbox`, `dialog`, `empty`, `field`, `input`, `label`, `native-select`, `progress`,
  `select`, `separator`, `table`, `textarea`
- `app/components/AppToaster.vue` – Toast-Darstellung mit Tailwind (E-S12/E-S15)
- `app/components/ListProgress.vue` – Ersatz für `UiProgress`, nutzt shadcn `Progress`
- `components.json`

### Entfernte Dateien

`app/assets/css/main.css`, `app/components/ui/UiModal.vue`, `UiConfirm.vue`, `UiToasts.vue`,
`UiProgress.vue`, `app/composables/useConfirm.ts`.
`app/composables/useToast.ts` bleibt unverändert bestehen (E-S15).

### Anpassungen an den Registry-Quellen

1. Importpfade `@/registry/new-york-v4/ui/…` → `@/components/shadcn/…`.
2. `table/utils.ts` gelöscht – einzige Stelle mit `@tanstack/vue-table` (E-S13).
3. Alle `@lucide/vue`-Icons durch Inline-SVGs mit denselben Pfaddaten ersetzt (E-S8):
   `DialogContent`, `DialogScrollContent`, `SelectTrigger`, `SelectItem`,
   `SelectScrollUpButton`, `SelectScrollDownButton`, `NativeSelect`, `Checkbox`.

### Ersetzungen im UI

| Vorher | Nachher |
|---|---|
| `.btn` / `.btn-primary` / `.btn-danger` / `.btn-ghost` | `Button` (`default`, `outline`, `ghost`) |
| `<input>` / `<select>` nativ | `Input` / `NativeSelect` |
| `.form-field` + `<label>` | `flex flex-col gap-2` + `Label` |
| `.card` | `Card` (+ `CardHeader`/`CardTitle`/`CardContent` im Login) |
| `UiModal` | `Dialog` (Admin 2×, Listen-Detail 3×) |
| `useConfirm()` | `AlertDialog` mit lokalem State (Übersicht 1×, Vorlagen 1×, Detail 2×) |
| `UiProgress` | `ListProgress` auf Basis von `Progress` |
| `<table>` in `admin/users.vue` | `Table` / `TableHeader` / `TableRow` / `TableHead` / `TableBody` / `TableCell` |
| `.badge` | `Badge` |
| `<input type="checkbox">` im Listen-Detail | `Checkbox` |
| Alle scoped `<style>`-Blöcke | Tailwind-Utilities |

Neue i18n-Schlüssel: `nav.language`, `toast.dismiss` (de + en).

Beibehalten: `vue-draggable-plus` mit den Handle-Klassen `group-drag-handle` /
`entry-drag-handle`, die `contenteditable`-Titel und das Inline-Edit-Muster (Speichern bei `blur`).

### Geprüft

- `npm run build` läuft ohne Fehler und ohne Auflösungswarnungen durch.
- Kein `resolveComponent(...)` in Client- oder Server-Chunks – alle Komponenten werden
  statisch aufgelöst, es fehlt also kein Auto-Import.
- Erzeugtes CSS enthält die Slate-Tokens in `oklch`, die Tailwind-Layer und `animate-in`;
  keine Reste der alten Custom Properties.
- Dev-Server: Login, `/api/lists`, `/`, `/templates`, `/admin/users` und der PDF-Export
  antworten mit 200; die serverseitig gerenderten Seiten enthalten shadcn-Markup.

### Nicht geprüft

Kein Browser verfügbar, daher ungetestet: das tatsächliche Öffnen und Schliessen der
Dialoge, Drag & Drop, das Umschalten der Checkboxen sowie die Darstellung insgesamt.
Diese Punkte brauchen einen manuellen Durchgang.

## 9. Nach einem allfälligen Merge zu erledigen

- `CLAUDE.md`: Regel «Kein UI-Framework, kein CSS-Framework, keine Icon-Library» ersetzen
  und die neuen Konventionen (Tailwind-Utilities statt scoped CSS, `app/components/shadcn/`)
  aufnehmen.
- `docs/Entscheide.md`: E-S1 bis E-S16 übernehmen.
- `docs/Umsetzung.md`: Abschnitt «UI-Basis» auf shadcn-vue umstellen.
