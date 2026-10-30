import * as fs from "node:fs/promises";
import type { FirestoreVerseDoc } from "../../../packages/infrastructure/firebase/src/firebase.bible.dto";
import type { LatinLexiconEntry } from "../../lexicons/shared/types";
import type { ProperName } from "../shared/parser";
import { buildNameMatcher } from "./names";
import {
  buildLemmaResolver,
  buildVerseTokens,
  buildWordResolver,
  type LemmaToken,
} from "./parser";

const LEXICON_URL = new URL(
  "../../lexicons/latin/output/latin-lewis-short.json",
  import.meta.url,
);
const VERSES_DIR_URL = "../../bible-databases/output/verses/";
const OUTPUT_DIR_URL = "./output/";

// TIPNR names are tagged with dStrongs, eg H3290; L&S ids never look like this
const DSTRONG = /^[GH]\d{4}/;

// Keep in sync with LATIN_BIBLE_IDS in lemmatize.py
export const latinBibleIds = ["VulgClementine"];

export async function loadLexicon(): Promise<LatinLexiconEntry[]> {
  return JSON.parse(await fs.readFile(LEXICON_URL, "utf-8"));
}

// Written by generate-names.ts
export const NAMES_URL = new URL(`${OUTPUT_DIR_URL}names.json`, import.meta.url);

export async function loadNames(): Promise<ProperName[]> {
  const content = await fs.readFile(NAMES_URL, "utf-8").catch(() => {
    throw new Error(`Missing ${NAMES_URL.pathname}, run generate:names-latin first`);
  });
  return JSON.parse(content);
}

export async function tokenizeLatinFile(
  bibleId: string,
  lexicon: LatinLexiconEntry[],
  names: ProperName[],
) {
  console.log(`Tokenizing ${bibleId} against Lewis & Short...`);

  const verses: FirestoreVerseDoc[] = JSON.parse(
    await fs.readFile(
      new URL(`${VERSES_DIR_URL}${bibleId}.json`, import.meta.url),
      "utf-8",
    ),
  );
  const lemmas: Record<string, LemmaToken[]> = JSON.parse(
    await fs.readFile(
      new URL(`${OUTPUT_DIR_URL}${bibleId}.lemmas.json`, import.meta.url),
      "utf-8",
    ),
  );
  const resolverForVerse = buildWordResolver(
    buildLemmaResolver(lexicon),
    buildNameMatcher(names),
  );

  let words = 0;
  let tagged = 0;
  let namesTagged = 0;
  const misaligned: string[] = [];
  const tokenized = verses.map((verse) => {
    const text = verse.tokens.map((t) => t.text).join("");
    const tokens = buildVerseTokens(
      text,
      lemmas[verse.id] ?? [],
      resolverForVerse(verse.id),
    );
    if (!tokens) {
      misaligned.push(verse.id);
      return { ...verse, tokens: [{ text }] };
    }
    for (const token of tokens) {
      if (!/\p{L}/u.test(token.text)) continue;
      words++;
      if (token.lexiconEntryIds) tagged++;
      if (token.lexiconEntryIds?.some((id) => DSTRONG.test(id))) namesTagged++;
    }
    return { ...verse, tokens };
  });

  console.log(
    `Tagged ${tagged}/${words} words (${((tagged / words) * 100).toFixed(2)}%), ${namesTagged} of them as TIPNR names; ${misaligned.length} verses not aligned with their lemmas`,
  );
  if (misaligned.length > 0) console.log(`Not aligned: ${misaligned.join(", ")}`);

  await fs.mkdir(new URL(OUTPUT_DIR_URL, import.meta.url), { recursive: true });
  const outputFileUrl = new URL(`${OUTPUT_DIR_URL}${bibleId}.json`, import.meta.url);
  await fs.writeFile(outputFileUrl, JSON.stringify(tokenized), "utf-8");
  console.log(`Wrote ${outputFileUrl.pathname}`);
}
