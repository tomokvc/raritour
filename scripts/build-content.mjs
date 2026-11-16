// Baut content/rounds/*.json + index.ts aus den Textdateien in content/src/*.txt
// Format:
//   @ 2026-11-17                 Datum der Runde (eine Datei = eine Runde)
//   # Frage                       neue Kategorie
//   > Erklärung                   Lauftext unter der Frage
//   Name|Alias:Gewicht, Name2     gültige Antworten (Gewicht = geschätzte Beliebtheit, Standard 1)
//   ! falsch = Hinweistext        Hinweis für typische falsche Antworten
import fs from "fs";
import path from "path";

const SRC = "content/src", OUT = "content/rounds";
const norm = (s) => s.toLowerCase().trim().replace(/ß/g, "ss").replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue")
  .normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]/g, "");
let errors = 0;
const err = (f, m) => { console.error(`✗ ${f}: ${m}`); errors++; };

for (const file of fs.readdirSync(SRC).filter((f) => f.endsWith(".txt")).sort()) {
  const lines = fs.readFileSync(path.join(SRC, file), "utf8").split("\n");
  let date = null; const cats = []; let c = null;
  for (let raw of lines) {
    const l = raw.trim();
    if (!l || l.startsWith("//")) continue;
    if (l.startsWith("@")) date = l.slice(1).trim();
    else if (l.startsWith("#")) cats.push((c = { q: l.slice(1).trim(), x: "", answers: [], hints: {} }));
    else if (!c) err(file, `Zeile vor erster Kategorie: ${l}`);
    else if (l.startsWith(">")) c.x = l.slice(1).trim();
    else if (l.startsWith("!")) { const [k, ...v] = l.slice(1).split("="); c.hints[k.trim()] = v.join("=").trim(); }
    else for (const e of l.split(",").map((s) => s.trim()).filter(Boolean)) {
      const [names, w] = e.split(":");
      const al = names.split("|").map((s) => s.trim()).filter(Boolean);
      c.answers.push({ name: al[0], aliases: al.slice(1), prior: w ? parseFloat(w) : 1 });
    }
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date || "")) err(file, "Datum fehlt (@ JJJJ-MM-TT)");
  if (cats.length !== 8) err(file, `${cats.length} statt 8 Kategorien`);
  for (const k of cats) {
    if (!k.x) err(file, `Erklärung fehlt: ${k.q}`);
    if (k.answers.length < 5) err(file, `zu wenige Antworten: ${k.q}`);
    const seen = new Map();
    for (const a of k.answers) {
      if (Number.isNaN(a.prior)) err(file, `Gewicht kaputt: ${a.name} (${k.q})`);
      for (const n of [a.name, ...a.aliases]) {
        const key = norm(n);
        if (seen.has(key) && seen.get(key) !== a.name) err(file, `doppelt „${n}“ in ${k.q} (${seen.get(key)})`);
        seen.set(key, a.name);
      }
    }
    for (const h of Object.keys(k.hints)) if (seen.has(norm(h))) err(file, `Hinweis „${h}“ ist eine gültige Antwort (${k.q})`);
  }
  fs.writeFileSync(path.join(OUT, `${date}.json`), JSON.stringify({ date, route: "hamburg-frankfurt", categories: cats }, null, 1));
  console.log(`✓ ${date}: ${cats.map((k) => `${k.q} (${k.answers.length})`).join(" · ")}`);
}

const files = fs.readdirSync(OUT).filter((f) => /^\d{4}-\d{2}-\d{2}\.json$/.test(f)).sort();
fs.writeFileSync(path.join(OUT, "index.ts"),
  "// Automatisch erzeugt von scripts/build-content.mjs – nicht von Hand bearbeiten\n" +
  files.map((f, i) => `import r${i} from "./${f}";`).join("\n") +
  `\n\nexport const ROUND_DATA = [${files.map((_, i) => `r${i}`).join(", ")}];\n`);
if (errors) { console.error(`\n${errors} Fehler`); process.exit(1); }
