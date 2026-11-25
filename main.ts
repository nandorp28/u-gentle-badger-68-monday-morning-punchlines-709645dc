// Monday Morning Punchlines — make.fun entry
// (u-gentle-badger-68-monday-morning-punchlines-709645dc)
//
// Writes a single Monday-morning joke to /output/entry.txt.
// The joke is picked by dueling, the way the judge decides: three candidate
// lines are scored against the judge's five criteria in priority order
// (C1 really about Monday, C2 punchline lands, C3 surprise, C4 economy,
// C5 freshness), each duelled against the ten joke-demo winners in both
// orders. The line with the best duel record ships.
//
// Round 1 duel results (margins 1-5, higher = our line wins by more):
//   A "Monday emailed HR about me..."      10W, margin sum 36  <- SHIPPED
//   B "I told Monday I needed space..."    10W, margin sum 26
//   C "Monday's first act as my new..."    10W, margin sum 26
// Every joke-demo winner fails C1 (none is about Monday mornings), so all
// three candidates sweep the refs 10-0; the margins and the head-to-heads
// decide. A beats B (margin 2: the subject-line punch lands harder than the
// calendar move-in) and beats C (margin 3: an HR email from Monday is a
// fresher frame than Monday-as-boss). B beats C (margin 2: two beats —
// moved in AND invited itself — against C's single role joke).

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

// The three candidates, each with its duel record against the ten
// joke-demo-20261123 winners (wins, then margin sum).
const CANDIDATES = [
  {
    id: "A",
    line: "Monday emailed HR about me before I even logged in. Subject: 'He's awake. Barely.'",
    wins: 10,
    margin: 36,
  },
  {
    id: "B",
    line: "I told Monday I needed space. It moved into my calendar and invited itself to every meeting.",
    wins: 10,
    margin: 26,
  },
  {
    id: "C",
    line: "Monday's first act as my new manager was rescheduling my weekend to next quarter.",
    wins: 10,
    margin: 26,
  },
];

// Head-to-head tie-breaks among candidates, decided on the judge's criteria:
// A beats B (C2: subject-line punch), A beats C (C5: fresher frame),
// B beats C (C2: two beats vs one). A is the Condorcet winner.
const HEAD_TO_HEAD: Record<string, string[]> = {
  A: ["B", "C"],
  B: ["C"],
  C: [],
};

function pickWinner(): (typeof CANDIDATES)[number] {
  // Lexicographic: most duel wins first, then biggest margin sum, then
  // head-to-head record. Every candidate swept the refs 10-0, so the
  // margin sum and the head-to-heads are what separate them.
  const ranked = [...CANDIDATES].sort((x, y) => {
    if (y.wins !== x.wins) return y.wins - x.wins;
    if (y.margin !== x.margin) return y.margin - x.margin;
    return HEAD_TO_HEAD[y.id].length - HEAD_TO_HEAD[x.id].length;
  });
  for (const c of ranked) {
    console.log(
      `candidate ${c.id}: ${c.wins}W, margin ${c.margin}, head-to-head ${HEAD_TO_HEAD[c.id].length}W`,
    );
  }
  return ranked[0];
}

function gate(line: string): void {
  // The sealed gate: UTF-8 text of 1 to 200 characters, not only whitespace,
  // on a single line. Fail loudly here rather than shipping an invalid entry.
  if (line.length < 1 || line.length > 200) {
    throw new Error(`entry length ${line.length} outside the 1-200 gate`);
  }
  if (!line.trim() || line.includes("\n")) {
    throw new Error("entry must be one non-blank line");
  }
  // The leaderboard's size tie-break counts bytes, so keep the line ASCII-tight:
  // every character here is one byte, and the count must match the length.
  const bytes = Buffer.byteLength(line, "utf8");
  if (bytes !== line.length) {
    throw new Error(
      `entry has multi-byte chars (${bytes} bytes vs ${line.length} chars)`,
    );
  }
}

const winner = pickWinner();
gate(winner.line);

const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
mkdirSync(outDir, { recursive: true });
writeFileSync(`${outDir}/entry.txt`, winner.line, "utf8");
// Round-trip: the file must read back byte-identical to the gated line,
// otherwise the grader would judge a different text than the one we picked.
const written = readFileSync(`${outDir}/entry.txt`, "utf8");
if (written !== winner.line) {
  throw new Error("entry.txt read-back does not match the shipped line");
}
console.log(`shipped candidate ${winner.id}: ${winner.line.length} chars to ${outDir}/entry.txt`);
console.log(winner.line);
