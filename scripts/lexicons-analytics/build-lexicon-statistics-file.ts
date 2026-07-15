import * as fs from "node:fs/promises";
import {
  buildLexiconStatisticsData,
  Language,
  TaggedWordRow,
} from "./build-lexicon-statistics-data";

const OUTPUT_DIR_URL = "./output/";

function parseMaculaTsv(content: string): TaggedWordRow[] {
  const lines = content.split(/\r?\n/);
  if (lines.length === 0) return [];

  const header = lines[0].split("\t");
  const refIdx = header.indexOf("ref");
  const strongIdx = header.indexOf("strong");
  if (refIdx === -1 || strongIdx === -1) {
    throw new Error("macula TSV missing required columns: ref, strong");
  }

  const rows: TaggedWordRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    const cols = line.split("\t");
    if (cols.length <= Math.max(refIdx, strongIdx)) continue;
    rows.push({ ref: cols[refIdx], strong: cols[strongIdx] });
  }
  return rows;
}

export async function buildLexiconStatisticsFile(
  tsvUrl: URL,
  language: Language,
) {
  const langName = language === "grc" ? "Greek" : "Hebrew";
  console.log(`Building ${langName} lexicon statistics from macula...`);

  const content = await fs.readFile(tsvUrl, "utf-8");
  const rows = parseMaculaTsv(content);
  console.log(`Parsed ${rows.length} tagged word tokens`);

  const entries = buildLexiconStatisticsData(rows, language);
  console.log(`Aggregated to ${entries.length} unique lexicon entries`);

  await fs.mkdir(new URL(OUTPUT_DIR_URL, import.meta.url), { recursive: true });
  const outputFileUrl = new URL(
    `${OUTPUT_DIR_URL}${language === "grc" ? "greek" : "hebrew"}-lexicon-statistics.json`,
    import.meta.url,
  );
  await fs.writeFile(outputFileUrl, JSON.stringify(entries, null, 2), "utf-8");
  console.log(`Wrote ${outputFileUrl.pathname}`);
}
