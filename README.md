# Raritour

Das tägliche Deutschland-Quiz: 8 Kategorien, eine Antwort pro Kategorie. Je **seltener** die Antwort unter allen Spielenden, desto schneller das Verkehrsmittel – von 🚶 Latschen bis 🛩️ Regierungsflieger – auf der Rundreise Hamburg → … → Bremen.

## Stack

- **Next.js 16** (App Router) – Frontend + API-Routen, Hosting auf **Vercel**
- **Supabase** (Postgres, Region Frankfurt) – speichert die Antworten für die Seltenheits-Statistik
- Schriften lokal über `@fontsource` (kein Google-Fonts-Abruf → DSGVO)
- Karte: eigene SVG-Karte (Natural Earth + Bundesländer-GeoJSON), Daten in `public/map/germany.json`

## Projektstruktur

```
content/rounds/        Tagesrunden als JSON (Kategorien, gültige Antworten, Schätzwerte, Hinweise)
src/lib/content.ts     Runden-Register + Datum (Europe/Berlin)
src/lib/normalize.ts   Normalisierung + Tippfehler-Matching
src/lib/rarity.ts      Seltenheits-Formel (Schätzwert + echte Zählungen)
src/app/api/round      GET  – heutige Runde (ohne Antworten)
src/app/api/answer     POST – Antwort prüfen, speichern, Anteil zurückgeben
src/game/              Spiel-Client (aus dem Prototyp übernommen)
supabase/migrations/   Datenbank-Schema
docs/                  Konzept + ursprünglicher HTML-Prototyp
```

## Lokal starten

```bash
npm install
cp .env.example .env.local   # Supabase-Werte eintragen (optional)
npm run dev                  # http://localhost:3000  (mit ?dev beliebig oft spielen)
```

Ohne Supabase-Variablen funktioniert alles, die Prozente kommen dann nur aus den Schätzwerten.

## Einrichtung Supabase

1. Neues Projekt anlegen, Region **Frankfurt (eu-central-1)**.
2. SQL Editor → Inhalt von `supabase/migrations/0001_init.sql` ausführen.
3. Settings → API: `Project URL` und `service_role`-Key kopieren.
   ⚠️ Der Service-Role-Key ist geheim – nur als Umgebungsvariable, nie ins Repo.

## Deployment Vercel

1. Vercel → *Add New Project* → Repo `raritour` importieren (Framework wird erkannt).
2. Environment Variables: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (optional `RARITY_PRIOR_WEIGHT`).
3. Settings → Functions → Region **Frankfurt (fra1)**.
4. Domain `raritour.de` unter Settings → Domains verbinden.

## Neue Runde anlegen

1. `content/rounds/JJJJ-MM-TT.json` nach Vorlage von `2026-11-16.json` anlegen (8 Kategorien).
   - `prior`: geschätzte Beliebtheit der Antwort (relativ, Standard 1)
   - `aliases`: Schreibvarianten; Groß/Klein, Umlaute und kleine Tippfehler werden automatisch toleriert
   - `hints`: Text für typische falsche Antworten
2. In `src/lib/content.ts` importieren und in `ROUNDS` eintragen.
3. Gibt es für einen Tag keine Datei, läuft die letzte vorhandene Runde weiter.

## Offen (Roadmap)

- [ ] 30 Runden Vorlauf (Antwortlisten halbautomatisch aus Wikidata)
- [ ] Impressum + Datenschutzerklärung vor öffentlichem Start
- [ ] Rate-Limiting für `/api/answer`
- [ ] Login, Streaks, Ligen
- [ ] MapLibre-Karte mit OpenFreeMap-Kacheln (Relief)
- [ ] Raritour Österreich / Schweiz

## Datenquellen Karte

Natural Earth (Public Domain) · Bundesländer: [isellsoap/deutschlandGeoJSON](https://github.com/isellsoap/deutschlandGeoJSON) · Ländergrenzen: world-atlas (Natural Earth)
