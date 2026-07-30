## Grundidee

Es wird eine Web-Applikation entwickelt, um Listen zu verwalten. Die Grundidee entstand beim Erstellen von Ferien-Packlisten.

Eine Liste besteht aus Einträgen, welche einer Gruppe zugeordnet werden können. Ziel ist, anhand der Liste z.b. zu prüfen, ob alles eingepackt wurde.

Beispiel:

In der Liste "Sommerferien 2026" gibt es einen Eintrag "Badehosen", welcher in der Gruppe "Badezeugs" eingetragen wird.

Jeder Eintrag kann auch markiert werden, sodass ersichtlich ist, was noch offen/zu packen ist. Zu jedem Eintrag kann auch noch ein Kommentar hinterlegt werden (bsp: "noch einkaufen").

Da die Einträge einer Gruppe in vielen Listen ähnlich ist, sollen Gruppen als "Vorlagen" gespeichert und in eine Liste übernommen werden können. So ist z.b. die Gruppe "Badezeugs" in vielen Listen gleich.

Jeder User kann seine eigenen Listen anlegen/verwalten. Ebenso kann er Listen an andere User freigeben. Die anderen User können dann an dieser Liste mitarbeiten.

## Systemarchitektur

* Web-Applikation auf Basis Nuxtjs mit server-seitiger sqlite-Db
* Eigenes UI mit Standard-HTML/CSS/JS, keine UI-Komponentenbibliothek
* Lokale User-Authentifikation mittels jwt-Token (user in Datenbank)
* Datenbank-Zugriff mittels nodejs-basierter ORM-Library, welches Migrationen unterstützt (bsp: prisma etc.)
* App als Docker-Compose-Projekt erstellen, mit App-Container und separaten Init-Container, welcher die offenen DB-Migrationen ausführt

## App-Aufbau

### Benutzer, Rollen

* 2 Rollen: Admin, Benutzer
* Admin kann Benutzer verwalten, und ein User Impersonation (Ausgeben als anderer User) durchführen
* Benutzer sieht nur seine Listen und die mit ihm geteilten Listen anderer User

### Entitäten

#### Benutzer

Stellt einen Benutzer dar, der das System benutzen kann.

- id: uuidv7, pk
- Email: string, unique, dient als Username
- Vorname, name: string
- passwort: string, bcrypt-gehashtes Passwort
- letzter login: timestamp
- aktiviert: boolean

#### Session-Tokens

Speichert die aktuellen Session- resp Refresh-Tokens. Bei jwt wird das Session-Token selber nicht gespeichert.

- id: uuidv7, pk
- user-id: uuidv7, fk
- erstellt, gültig bis: auto-timestamp
- refresh-Token, string, hash eines refresh-Tokens des Users. Damit kann ein neues jwt erstellt werden.

#### Gruppe

Eine Sammlung von Einträgen, welche als Kopiervorlage für Listen-Gruppen dient

- id: uuidv7, pk
- bezeichnung: string
- user-id: uuidv7, fk
- liste-id: uuidv7, fk: wenn gesetzt, ist dies eine Gruppe, die zu einer Liste gehört, sonst ist es eine Vorlagengruppe
- orig-gruppe-id: uuidv7: id der Originalgruppe, falls kopiert
- Reihenfolge, nr: Sortierreihenfolge innerhalb einer Liste

#### Liste

Eine Liste enthält Gruppen, welche wiederum Einträge enthält 

- id: uuidv7, pk
- bezeichnung: string
- user-id: uuidv7, fk
- erstellt, geändert: auto-timestamps

#### Listen-Freigaben

Dient der Verlinkung von Listen, welche für andere User freigegeben werden

- id: uuidv7, pk
- user-id: uuidv7, fk, Besitzer der freizugebenden Liste
- shared-user-id: uuidv7, user, der die Liste auch bearbeiten darf

#### Eintrag

Die einzelnen Einträge einer Gruppe.

- id: uuidv7, pk
- bezeichnung: string
- user-id: uuidv7, fk
- erstellt, geändert: auto-timestamps
- gruppe-id, fk
- reihenfolge: nr, Sortierreihenfolge
- erledigt, bool: nur benötigt, wenn zu einer Listen-Gruppe gehört: bei einer Vorlagen-Gruppe wird das Flag nicht benötigt
- anzahl: int, optional (z.B. Socken, Anzahl 5); gilt für Vorlagen- und Listen-Einträge

### Ui-Module

#### Admin

- Userverwaltung: Erstellen, verwalten, sperren, Passwörter resetten
- impersonifizierungs-Funktion: Wahl eines Users, neues session-Token generieren, neu laden. Möglichkeit, wieder zum Admin zurück zu wechseln: info in jwt speichern.

#### Gruppen verwalten

Modul, in dem der User seine gespeicherten Gruppen verwalten kann. Die gespeicherten Gruppen dienen als Vorlage für die Zuweisung in Listen.

* Auflisten von Gruppen
* Editieren der Gruppe (Name)
* Editieren der Einträge
* Reihenfolge festlegen (drag'n'drop)

Die Einträge weisen auf dieser Ebene kein Erledigt-Flag auf.

#### Listen verwalten

Der User sieht seine sowie fremde (durch Teilen sichtbare) Listen und kann hier neue erstellen sowie bestehende bearbeiten, löschen.
Kachel- resp. Grid- Ansicht

**Neue Liste erstellen**

Neue Liste wird mit Standard-Name erstellt und es wird direkt die Eingabemaske angezeigt.

**Eingabe-Ui Liste**

Bezeichnung: Darstellung als html titel, content-editable

**Gruppe hinzufügen**: neue Gruppe, wird direkt dargestellt mit Bezeichnung "Neue Gruppe" als Titel, contenteditable

Innerhalb der Gruppe: Einträge hinzufügen, bearbeiten, löschen, mit Erledigt-Checkbox

**Gruppe von Vorlagen kopieren**: suche in Vorlagen-Gruppe, dann Kopieren der Gruppe und deren Einträge in die sktuelle Liste

Gruppen als Kacheln/grid darstellen, mit Einträgen als Liste darin.

**Sortierung:**

Sowohl die Gruppen als Ganzes wie auch die Einträge innerhalb der Gruppe sollen mittels Drag'n'drop angeordnet/sortiert werden können. Einträge sollen so auch in eine andere Gruppe der Liste verschoben werden können.

**Export**

Eine Liste soll als PDF und Excel exportiert werden können.

Darstellung/Sortierung wie in der Oberfläche

## TODO

- Listenansicht: contenteditable nur wenn auf Schreiber geklickt - bei normalem Klick auf Listentitel soll diese aufgehen


