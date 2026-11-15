import { connection } from "next/server";
import { berlinDate, roundFor, roundNumber } from "@/lib/content";

/** Heutige Runde – ohne Antwortlisten (die bleiben auf dem Server). */
export async function GET() {
  await connection(); // immer zur Anfragezeit (Datum!), nie beim Build vorrendern
  const date = berlinDate();
  const r = roundFor(date);
  return Response.json({
    date,
    number: roundNumber(date),
    route: r.route,
    categories: r.categories.map((c) => ({ q: c.q, x: c.x })),
  });
}
