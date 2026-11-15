/** Antwort-Normalisierung und Fuzzy-Matching (Tippfehler-Toleranz). */
export function norm(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/ß/g, "ss")
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

/** Damerau-Levenshtein (OSA): Vertauschung zweier Nachbarzeichen zählt als 1. */
export function distance(a: string, b: string): number {
  const m = a.length, n = b.length;
  let pp: number[] = [];
  let p = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const q = [i];
    for (let j = 1; j <= n; j++) {
      q[j] = Math.min(p[j] + 1, q[j - 1] + 1, p[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) q[j] = Math.min(q[j], pp[j - 2] + 1);
    }
    pp = p;
    p = q;
  }
  return p[n];
}

export interface Answer { name: string; aliases: string[]; prior: number }

/** Exakter Treffer zuerst, sonst eindeutiger Fuzzy-Treffer (1 Fehler ab 4, 2 Fehler ab 9 Zeichen). */
export function match(answers: Answer[], raw: string): Answer | null {
  const k = norm(raw);
  if (!k) return null;
  for (const a of answers) if ([a.name, ...a.aliases].some((x) => norm(x) === k)) return a;
  if (k.length < 4) return null;
  let best: Answer | null = null, bd = 99, tie = false;
  for (const a of answers)
    for (const key of [a.name, ...a.aliases].map(norm)) {
      const d = distance(k, key);
      if (d < bd) { bd = d; best = a; tie = false; } else if (d === bd && best !== a) tie = true;
    }
  const lim = k.length >= 9 ? 2 : 1;
  return bd <= lim && !tie ? best : null;
}
