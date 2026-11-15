import type { Answer } from "./normalize";
import r20261116 from "../../content/rounds/2026-11-16.json";

export interface Category { q: string; x: string; answers: Answer[]; hints: Record<string, string> }
export interface Round { date: string; route: string; categories: Category[] }

/** Alle Runden. Neue Runde = JSON-Datei in content/rounds/ anlegen und hier eintragen. */
const ROUNDS: Round[] = [r20261116 as Round].sort((a, b) => a.date.localeCompare(b.date));

export const LAUNCH_DATE = "2026-11-16";

/** Heutiges Datum in Europe/Berlin (Rundenwechsel um 00:00 Uhr deutscher Zeit). */
export function berlinDate(d = new Date()): string {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Berlin" }).format(d);
}

/** Runde für ein Datum; gibt es keine, die letzte Runde davor (bzw. die erste). */
export function roundFor(date: string): Round {
  const past = ROUNDS.filter((r) => r.date <= date);
  return past.length ? past[past.length - 1] : ROUNDS[0];
}

export function roundNumber(date: string): number {
  const ms = Date.parse(date) - Date.parse(LAUNCH_DATE);
  return Math.max(1, Math.round(ms / 86400000) + 1);
}
