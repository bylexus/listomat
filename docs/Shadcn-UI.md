# shadcn-vue Einführung

Arbeitsdokument für den Branch `shadcn-ui`. Hält Abklärungen, Erkenntnisse, offene Fragen
und (später) die getroffenen Entscheide fest.

Status: **Abklärung – Entscheide E-S1 bis E-S6 gefällt, F7–F13 offen. Noch kein Code geändert.**
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
| ~~F4~~ | *geklärt → E-S4* (Prefix noch offen, siehe F12) |
| ~~F5~~ | *geklärt → E-S3* |
| ~~F6~~ | *geklärt → E-S6* |
| F7 | Icons: heute stecken Lucide-ähnliche SVGs inline im Markup (Papierkorb, Drag-Handle u.a.). `@lucide/vue` aufnehmen und ersetzen, oder Inline-SVGs behalten? |
| F8 | Toasts: `Sonner` (zusätzlich `vue-sonner`) oder `UiToasts` behalten und nur optisch angleichen? |
| F9 | `admin/users.vue`: einfache `Table` oder `DataTable` mit TanStack Table? |
| F10 | Dark Mode: mitnehmen oder bewusst weglassen? |
| F11 | Wird dieser Branch nach Abschluss in `main` gemergt, oder ist das ein Experiment mit offenem Ausgang? |
| F12 | Auto-Import-Prefix für `app/components/shadcn/`: `''` → `<Button>`, `<Dialog>` (kurz, kollidiert mit nichts) oder z.B. `'S'` → `<SButton>` (explizit erkennbar, woher die Komponente stammt)? |
| F13 | Was geschieht mit `UiModal`/`UiConfirm`/`UiToasts`/`UiProgress` – ersatzlos löschen, oder als dünne Wrapper über den shadcn-Komponenten behalten, damit `useConfirm`/`useToast` unverändert bleiben? |

## 6. Entscheide

| Nr. | Entscheid | Datum |
|---|---|---|
| E-S1 | shadcn-vue wird eingeführt. Die Regel «Kein UI-Framework, kein CSS-Framework, keine Icon-Library» gilt für diesen Branch nicht mehr; Tailwind CSS v4 wird Styling-Basis. Bedingung: **`main` bleibt unangetastet**, die Arbeit findet ausschliesslich im Branch `shadcn-ui` statt. `CLAUDE.md` wird erst bei einem allfälligen Merge angepasst. | 2026-07-27 |
| E-S2 | `app/assets/css/main.css` wird **ersatzlos entfernt** (harter Schnitt). Kein `@layer`-Workaround, keine Koexistenz. Damit sind sämtliche Seiten und Layouts in einem Zug zu migrieren – Zwischenstände im Branch sind ungestylt und das ist akzeptiert. | 2026-07-27 |
| E-S3 | Die shadcn-Komponenten werden per offiziellem CLI (`shadcn-vue add …`) ins Repo geholt. Dazu wird `shadcn-vue.com` in den Netzwerk-Einstellungen der Sandbox freigegeben. | 2026-07-27 |
| E-S4 | shadcn-Komponenten kommen in ein **eigenes Verzeichnis** `app/components/shadcn/` (`componentDir: '@/components/shadcn'`). `app/components/ui/` bleibt den projekteigenen Komponenten vorbehalten. | 2026-07-27 |
| E-S5 | Basis-Farbe für `shadcn-vue init`: **Slate**. Die bisherige Primärfarbe `#2563eb` wird nicht übernommen; es gilt das shadcn-Standard-Theme. | 2026-07-27 |
| E-S6 | Die Migration erfolgt in **einem einzigen Commit** (Setup + Komponenten + alle Seiten/Layouts). Keine Zwischenstopps; die Prüfung erfolgt am Gesamtresultat. | 2026-07-27 |

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
