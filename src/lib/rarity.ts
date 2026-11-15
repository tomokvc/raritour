/**
 * Anteil einer Antwort in Prozent.
 * Solange wenige Spieler da sind, werden die redaktionellen Schätzwerte (prior) beigemischt,
 * damit die ersten Spieler keine absurden Ergebnisse bekommen. Mit wachsender Spielerzahl
 * verliert die Schätzung an Gewicht:  Anteil = (priorAnteil·K + Treffer) / (K + Gesamt)
 */
export const K = Number(process.env.RARITY_PRIOR_WEIGHT ?? 50);

export function share(priorShare: number, hits: number, total: number): number {
  return ((priorShare * K + hits) / (K + total)) * 100;
}
