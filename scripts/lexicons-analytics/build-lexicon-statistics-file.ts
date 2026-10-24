import * as fs from "node:fs/promises";
import { getVerseId } from "@bible-app/domain";
import {
  buildLexiconStatisticsData,
  Language,
  TaggedWordRow,
} from "./build-lexicon-statistics-data";

const OUTPUT_DIR_URL = "./output/";

// eg "Mat.1.1#01=NKO" or "Gen.31.55(32.1)#01=L" — English ref first, Hebrew ref in brackets
const WORD_REF = /^(\w{3})\.(\d+)\.(\d+)(?:\([^)]*\))?#\d+=/;

// TAGNT: "G2424G=N-GSM-P"
function parseGreekDStrongs(cols: string[]): string[] {
  const [dStrong] = cols[3].split("=");
  return dStrong ? [dStrong.trim()] : [];
}

// TAHOT: "H9003/{H7225G}\H9016" — "/" splits prefix/root/suffix, "\" starts punctuation
function parseHebrewDStrongs(cols: string[]): string[] {
  const [lexical] = cols[4].split("\\");
  return lexical
    .split("/")
    .map((s) => s.replace(/[{}+\s]/g, ""))
    .filter(Boolean);
}

function parseStepTaggedText(
  content: string,
  language: Language,
): TaggedWordRow[] {
  const parseDStrongs =
    language === "grc" ? parseGreekDStrongs : parseHebrewDStrongs;

  const rows: TaggedWordRow[] = [];
  for (const line of content.split(/\r?\n/)) {
    const match = line.match(WORD_REF);
    if (!match) continue;
    const [, book, chapter, verse] = match;
    rows.push({
      verseId: getVerseId(book.toUpperCase(), Number(chapter), Number(verse)),
      dStrongs: parseDStrongs(line.split("\t")),
    });
  }
  return rows;
}

export async function buildLexiconStatisticsFile(
  fileUrls: URL[],
  language: Language,
) {
  const langName = language === "grc" ? "Greek" : "Hebrew";
  console.log(`Building ${langName} lexicon statistics from STEP...`);

  const rows: TaggedWordRow[] = [];
  for (const fileUrl of fileUrls) {
    const content = await fs.readFile(fileUrl, "utf-8");
    rows.push(...parseStepTaggedText(content, language));
  }
  console.log(`Parsed ${rows.length} tagged word tokens`);

  const entries = buildLexiconStatisticsData(rows);
  console.log(`Aggregated to ${entries.length} unique lexicon entries`);

  await fs.mkdir(new URL(OUTPUT_DIR_URL, import.meta.url), { recursive: true });
  const outputFileUrl = new URL(
    `${OUTPUT_DIR_URL}${language === "grc" ? "greek" : "hebrew"}-lexicon-statistics.json`,
    import.meta.url,
  );
  await fs.writeFile(outputFileUrl, JSON.stringify(entries, null, 2), "utf-8");
  console.log(`Wrote ${outputFileUrl.pathname}`);
}
