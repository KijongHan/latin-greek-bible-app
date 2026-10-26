import * as fs from "node:fs/promises";
import { getChapterId, type Token } from "@bible-app/domain";
import type { FirestoreVerseDoc } from "../../../packages/infrastructure/firebase/src/firebase.bible.dto";
import { loadTagnt } from "../greek/tokenize";
import { loadTahot } from "../hebrew/tokenize";
import type { Tags } from "../shared/parser";
import {
  buildVerseTokens,
  greekTagsBySourceId,
  hebrewTagsBySourceId,
  parseAlignment,
  parseSources,
  parseTargets,
} from "./parser";

const CLEAR_DATA_DIR = "../../../vendor/clear-bible-alignments/data/";
const OUTPUT_DIR_URL = "./output/";

export type Testament = "nt" | "ot";

const testamentFiles: Record<
  Testament,
  { targets: string; sources: string; alignment: string }
> = {
  nt: {
    targets: "eng/targets/BSB/nt_BSB.tsv",
    sources: "sources/SBLGNT.tsv",
    alignment: "eng/alignments/BSB/SBLGNT-BSB-manual.json",
  },
  ot: {
    targets: "eng/targets/BSB/ot_BSB.tsv",
    sources: "sources/WLCM.tsv",
    alignment: "eng/alignments/BSB/WLCM-BSB-manual.json",
  },
};

const readClear = (path: string) =>
  fs.readFile(new URL(`${CLEAR_DATA_DIR}${path}`, import.meta.url), "utf-8");

async function tagsForTestament(
  testament: Testament,
  sources: ReturnType<typeof parseSources>,
): Promise<Map<string, Tags>> {
  if (testament === "nt") return greekTagsBySourceId(sources, await loadTagnt());
  const { tags, rootOnlyWords } = hebrewTagsBySourceId(sources, await loadTahot());
  console.log(`${rootOnlyWords} Hebrew words fell back to TAHOT's root part`);
  return tags;
}

export async function tokenizeBsbTestament(
  testament: Testament,
): Promise<FirestoreVerseDoc[]> {
  console.log(`Tokenizing BSB ${testament.toUpperCase()} against Clear alignments...`);
  const files = testamentFiles[testament];
  const targets = parseTargets(await readClear(files.targets));
  const sources = parseSources(await readClear(files.sources));
  const sourcesByTarget = parseAlignment(await readClear(files.alignment));
  const tagsBySourceId = await tagsForTestament(testament, sources);

  let words = 0;
  let tagged = 0;
  const verses: FirestoreVerseDoc[] = [];
  for (const [verseId, verseWords] of targets) {
    // Clear numbers Psalm titles as verse 0 (eg PSA.3.0); the app's BSB has no verse 0
    if (verseId.endsWith(".0")) continue;
    const tokens: Token[] = buildVerseTokens(
      verseWords,
      sourcesByTarget,
      tagsBySourceId,
    );
    words += verseWords.filter((w) => !w.exclude).length;
    tagged += tokens.filter((t) => t.lexiconEntryIds).length;

    const [bookId, chapter, verse] = verseId.split(".");
    verses.push({
      bibleId: "BSB",
      bookId,
      chapterId: getChapterId(bookId, Number(chapter)),
      id: verseId,
      verseNumber: Number(verse),
      tokens,
    });
  }

  console.log(
    `Tagged ${tagged}/${words} words (${((tagged / words) * 100).toFixed(2)}%) in ${verses.length} verses`,
  );
  return verses;
}

export async function writeTokenizedBsb(verses: FirestoreVerseDoc[]) {
  await fs.mkdir(new URL(OUTPUT_DIR_URL, import.meta.url), { recursive: true });
  const outputFileUrl = new URL(`${OUTPUT_DIR_URL}BSB.json`, import.meta.url);
  await fs.writeFile(outputFileUrl, JSON.stringify(verses, null, 2), "utf-8");
  console.log(`Wrote ${outputFileUrl.pathname}`);
}
