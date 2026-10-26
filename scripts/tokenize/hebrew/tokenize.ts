import * as fs from "node:fs/promises";
import type { FirestoreVerseDoc } from "../../../packages/infrastructure/firebase/src/firebase.bible.dto";
import {
  normalizeHebrew,
  parseTahot,
  tokenizeVerse,
  type TaggedWord,
  type TahotWord,
} from "../shared/parser";

const TAHOT_DIR = "../../../vendor/stepbible-data/Translators Amalgamated OT+NT/";
const TAHOT_URLS = [
  "TAHOT Gen-Deu - Translators Amalgamated Hebrew OT - STEPBible.org CC BY.txt",
  "TAHOT Jos-Est - Translators Amalgamated Hebrew OT - STEPBible.org CC BY.txt",
  "TAHOT Job-Sng - Translators Amalgamated Hebrew OT - STEPBible.org CC BY.txt",
  "TAHOT Isa-Mal - Translators Amalgamated Hebrew OT - STEPBible.org CC BY.txt",
].map((file) => new URL(`${TAHOT_DIR}${file}`, import.meta.url));

const VERSES_DIR_URL = "../../bible-databases/output/verses/";
const OUTPUT_DIR_URL = "./output/";

// Hebrew bibles tokenized against TAHOT, which is based on the Leningrad Codex
export const hebrewBibleIds = ["WLC"];

// Splits on whitespace and after a maqqef, which TAHOT counts as a word break
const HEBREW_SEPARATOR = /(\s+|(?<=־))/;

export async function loadTahot(): Promise<Map<string, TahotWord>> {
  const contents = await Promise.all(
    TAHOT_URLS.map((url) => fs.readFile(url, "utf-8")),
  );
  return parseTahot(contents.join("\n"));
}

export async function tokenizeHebrewFile(
  bibleId: string,
  tahot: Map<string, TaggedWord[]>,
) {
  console.log(`Tokenizing ${bibleId} against TAHOT...`);

  const content = await fs.readFile(
    new URL(`${VERSES_DIR_URL}${bibleId}.json`, import.meta.url),
    "utf-8",
  );
  const verses: FirestoreVerseDoc[] = JSON.parse(content);

  let words = 0;
  let tagged = 0;
  let untaggedVerses = 0;
  const tokenized = verses.map((verse) => {
    const taggedWords = tahot.get(verse.id);
    if (!taggedWords) untaggedVerses++;
    const tokens = tokenizeVerse(
      verse.tokens.map((t) => t.text).join(""),
      taggedWords ?? [],
      { normalize: normalizeHebrew, separator: HEBREW_SEPARATOR },
    );
    for (const token of tokens) {
      if (!normalizeHebrew(token.text)) continue;
      words++;
      if (token.lexiconEntryIds) tagged++;
    }
    return { ...verse, tokens };
  });

  console.log(
    `Tagged ${tagged}/${words} words (${((tagged / words) * 100).toFixed(2)}%); ${untaggedVerses} verses not in TAHOT`,
  );

  await fs.mkdir(new URL(OUTPUT_DIR_URL, import.meta.url), { recursive: true });
  const outputFileUrl = new URL(`${OUTPUT_DIR_URL}${bibleId}.json`, import.meta.url);
  await fs.writeFile(outputFileUrl, JSON.stringify(tokenized, null, 2), "utf-8");
  console.log(`Wrote ${outputFileUrl.pathname}`);
}
