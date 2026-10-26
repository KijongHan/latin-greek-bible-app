import * as fs from "node:fs/promises";
import { getChapterId } from "@bible-app/domain";
import type { FirestoreVerseDoc } from "../../../packages/infrastructure/firebase/src/firebase.bible.dto";
import { loadTagnt } from "../greek/tokenize";
import { loadTahot } from "../hebrew/tokenize";
import { wordsForEdition, type Tags } from "../shared/parser";
import { buildVerseTokens, parseStrongAliases, parseUsfm } from "./parser";

const USFM_DIR_URL = new URL("../../../vendor/ebible-kjv/", import.meta.url);
const LEXICON_DIR = "../../../vendor/stepbible-data/Lexicons/";
const LEXICON_URLS = [
  "TBESG - Translators Brief lexicon of Extended Strongs for Greek - STEPBible.org CC BY.txt",
  "TBESH - Translators Brief lexicon of Extended Strongs for Hebrew - STEPBible.org CC BY.txt",
].map((file) => new URL(`${LEXICON_DIR}${file}`, import.meta.url));
const OUTPUT_DIR_URL = "./output/";

// The KJV NT was translated from the TR; TAGNT's TR edition is Scrivener 1894, which
// reconstructs the KJV's Greek
const TAGNT_EDITION = "TR";

// Source words of each KJV verse: TAGNT's TR words for the NT, TAHOT for the OT
async function loadSourceWords(): Promise<Map<string, Tags[]>> {
  const verses = new Map<string, Tags[]>();
  const add = (verseId: string, words: Tags[]) => {
    if (!verses.has(verseId)) verses.set(verseId, []);
    verses.get(verseId)!.push(...words);
  };

  for (const words of (await loadTagnt()).values()) {
    for (const word of words) {
      add(word.kjvVerseId, wordsForEdition([word], TAGNT_EDITION));
    }
  }
  for (const word of (await loadTahot()).values()) {
    add(word.englishVerseId, [word]);
  }
  return verses;
}

async function loadStrongAliases(): Promise<Map<string, string[]>> {
  const contents = await Promise.all(
    LEXICON_URLS.map((url) => fs.readFile(url, "utf-8")),
  );
  return parseStrongAliases(contents.join("\n"));
}

export async function tokenizeKjv(): Promise<FirestoreVerseDoc[]> {
  console.log("Tokenizing KJV against TAGNT (TR) and TAHOT by Strong's number...");
  const sourceWords = await loadSourceWords();
  const aliases = await loadStrongAliases();

  const files = (await fs.readdir(USFM_DIR_URL)).filter((f) => f.endsWith(".usfm")).sort();
  let words = 0;
  let tagged = 0;
  let strongTagged = 0;
  let aliased = 0;
  const unmatched = new Map<string, number>();
  const missingVerses: string[] = [];
  const verses: FirestoreVerseDoc[] = [];

  for (const file of files) {
    const content = await fs.readFile(new URL(file, USFM_DIR_URL), "utf-8");
    for (const [verseId, segments] of parseUsfm(content)) {
      const source = sourceWords.get(verseId);
      if (!source) missingVerses.push(verseId);
      const result = buildVerseTokens(segments, source ?? [], aliases);
      aliased += result.aliased;

      for (const token of result.tokens) {
        if (!/\p{L}/u.test(token.text)) continue;
        words++;
        if (token.lexiconEntryIds) tagged++;
      }
      strongTagged += segments.filter((s) => s.strong).length;
      for (const strong of result.unmatched) {
        unmatched.set(strong, (unmatched.get(strong) ?? 0) + 1);
      }

      const [bookId, chapter, verse] = verseId.split(".");
      verses.push({
        bibleId: "KJV",
        bookId,
        chapterId: getChapterId(bookId, Number(chapter)),
        id: verseId,
        verseNumber: Number(verse),
        tokens: result.tokens,
      });
    }
  }

  const unmatchedCount = [...unmatched.values()].reduce((a, b) => a + b, 0);
  console.log(
    `Tagged ${tagged}/${words} words (${((tagged / words) * 100).toFixed(2)}%) in ${verses.length} verses`,
  );
  console.log(
    `${strongTagged - unmatchedCount}/${strongTagged} Strong's tags matched a source word (${(((strongTagged - unmatchedCount) / strongTagged) * 100).toFixed(2)}%), ${aliased} through a TBESG/TBESH alias`,
  );
  console.log(
    `Most common unmatched: ${[...unmatched]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([s, n]) => `${s}×${n}`)
      .join(", ")}`,
  );
  console.log(`${missingVerses.length} verses not in TAGNT/TAHOT: ${missingVerses.slice(0, 10).join(", ")}`);
  return verses;
}

export async function writeTokenizedKjv(verses: FirestoreVerseDoc[]) {
  await fs.mkdir(new URL(OUTPUT_DIR_URL, import.meta.url), { recursive: true });
  const outputFileUrl = new URL(`${OUTPUT_DIR_URL}KJV.json`, import.meta.url);
  await fs.writeFile(outputFileUrl, JSON.stringify(verses, null, 2), "utf-8");
  console.log(`Wrote ${outputFileUrl.pathname}`);
}
