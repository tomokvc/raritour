import { berlinDate, roundFor } from "@/lib/content";
import { match, norm } from "@/lib/normalize";
import { share } from "@/lib/rarity";
import { db } from "@/lib/db";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(req: Request) {
  let body: { date?: string; cat?: number; answer?: string; playerId?: string };
  try { body = await req.json(); } catch { return Response.json({ error: "bad_json" }, { status: 400 }); }
  const { date, cat, answer, playerId } = body;

  // Nur heutige oder gestrige Runde (wer um 23:59 startet, darf noch fertig spielen)
  const today = berlinDate(), yesterday = berlinDate(new Date(Date.now() - 86400000));
  if (date !== today && date !== yesterday) return Response.json({ error: "round_closed" }, { status: 400 });
  if (typeof answer !== "string" || answer.length > 80 || !Number.isInteger(cat) || !playerId || !UUID.test(playerId))
    return Response.json({ error: "bad_input" }, { status: 400 });

  const round = roundFor(date);
  const c = round.categories[cat as number];
  if (!c) return Response.json({ error: "bad_input" }, { status: 400 });

  const hit = match(c.answers, answer);
  if (!hit) {
    // Abgelehnte Antwort merken (für die Pflege der Antwortlisten); Fehler hier nie an den Spieler durchreichen
    const sbm = db();
    if (sbm) await sbm.from("misses").insert({ round_date: date, cat, answer: answer.trim().slice(0, 80) }).then(() => {}, () => {});
    const hint = Object.entries(c.hints).find(([k]) => norm(k) === norm(answer))?.[1] ?? null;
    return Response.json({ ok: false, hint });
  }

  const priorSum = c.answers.reduce((s, a) => s + a.prior, 0);
  const priorShare = hit.prior / priorSum;
  const key = norm(hit.name);

  let hits = 0, total = 0;
  const sb = db();
  if (sb) {
    // Eine Antwort pro Spieler und Kategorie; doppelte Einsendungen werden ignoriert
    await sb.from("submissions").upsert(
      { round_date: date, cat, answer_key: key, player_id: playerId },
      { onConflict: "round_date,cat,player_id", ignoreDuplicates: true },
    );
    const base = () => sb.from("submissions").select("id", { count: "exact", head: true }).eq("round_date", date).eq("cat", cat as number);
    const [a, b] = await Promise.all([base().eq("answer_key", key), base()]);
    hits = a.count ?? 0;
    total = b.count ?? 0;
  }

  return Response.json({ ok: true, name: hit.name, pct: share(priorShare, hits, total), players: total });
}
