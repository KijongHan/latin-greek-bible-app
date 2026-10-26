import * as fs from "node:fs/promises";
import type { FirestoreVerseDoc } from "../../../packages/infrastructure/firebase/src/firebase.bible.dto";
import {
  parseTagnt,
  tokenizeVerse,
  TaggedVerseWord,
  wordsForEdition,
} from "../shared/parser";

const TAGNT_DIR = "../../../vendor/stepbible-data/Translators Amalgamated OT+NT/";
const TAGNT_URLS = [
  "TAGNT Mat-Jhn - Translators Amalgamated Greek NT - STEPBible.org CC-BY.txt",
  "TAGNT Act-Rev - Translators Amalgamated Greek NT - STEPBible.org CC-BY.txt",
].map((file) => new URL(`${TAGNT_DIR}${file}`, import.meta.url));

const VERSES_DIR_URL = "../../bible-databases/output/verses/";
const OUTPUT_DIR_URL = "./output/";

// Bible id -> TAGNT edition code
export const bibleEditions: Record<string, string> = {
  Byz: "Byz",
  TR: "TR",
};

export async function loadTagnt(): Promise<Map<string, TaggedVerseWord[]>> {
  const verses = new Map<string, TaggedVerseWord[]>();
  for (const url of TAGNT_URLS) {
    const content = await fs.readFile(url, "utf-8");
    for (const [verseId, words] of parseTagnt(content)) verses.set(verseId, words);
  }
  return verses;
}

export async function tokenizeVersesFile(
  bibleId: string,
  tagnt: Map<string, TaggedVerseWord[]>,
) {
  const edition = bibleEditions[bibleId];
  console.log(`Tokenizing ${bibleId} against TAGNT edition ${edition}...`);

  const content = await fs.readFile(
    new URL(`${VERSES_DIR_URL}${bibleId}.json`, import.meta.url),
    "utf-8",
  );
  const verses: FirestoreVerseDoc[] = JSON.parse(content);

  let words = 0;
  let tagged = 0;
  let untaggedVerses = 0;
  const tokenized = verses.map((verse) => {
    const taggedWords = tagnt.get(verse.id);
    if (!taggedWords) untaggedVerses++;
    const tokens = tokenizeVerse(
      verse.tokens.map((t) => t.text).join(""),
      wordsForEdition(taggedWords ?? [], edition),
    );
    for (const token of tokens) {
      if (!/\S/.test(token.text)) continue;
      words++;
      if (token.lexiconEntryIds) tagged++;
    }
    return { ...verse, tokens };
  });

  console.log(
    `Tagged ${tagged}/${words} words (${((tagged / words) * 100).toFixed(2)}%); ${untaggedVerses} verses not in TAGNT`,
  );

  await fs.mkdir(new URL(OUTPUT_DIR_URL, import.meta.url), { recursive: true });
  const outputFileUrl = new URL(`${OUTPUT_DIR_URL}${bibleId}.json`, import.meta.url);
  await fs.writeFile(outputFileUrl, JSON.stringify(tokenized, null, 2), "utf-8");
  console.log(`Wrote ${outputFileUrl.pathname}`);
}
