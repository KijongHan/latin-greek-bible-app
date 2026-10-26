import * as fs from "node:fs/promises";
import { argv } from "node:process";
import {
  toVerse,
  type FirestoreVerseDoc,
} from "../../packages/infrastructure/firebase/src/firebase.bible.dto";
import { firebaseBibleMutations } from "@bible-app/firebase";
import { bibleEditions } from "./greek/tokenize";
import { hebrewBibleIds } from "./hebrew/tokenize";

// Bible id -> the output file its tokenizer writes
const outputFiles: Record<string, string> = {
  ...Object.fromEntries(
    Object.keys(bibleEditions).map((id) => [id, `./greek/output/${id}.json`]),
  ),
  ...Object.fromEntries(
    hebrewBibleIds.map((id) => [id, `./hebrew/output/${id}.json`]),
  ),
  BSB: "./bsb/output/BSB.json",
  KJV: "./kjv/output/KJV.json",
};

async function main(bibleIds: string[]) {
  const urls = bibleIds.map((id) => new URL(outputFiles[id], import.meta.url));

  // Fail before uploading anything if a tokenizer hasn't been run
  const missing: string[] = [];
  for (const [i, url] of urls.entries()) {
    await fs.access(url).catch(() => missing.push(`${bibleIds[i]} (${outputFiles[bibleIds[i]]})`));
  }
  if (missing.length > 0) {
    throw new Error(`Missing tokenized output, run its generate script first: ${missing.join(", ")}`);
  }

  for (const [i, url] of urls.entries()) {
    const verses: FirestoreVerseDoc[] = JSON.parse(await fs.readFile(url, "utf-8"));
    console.log(`Batch-uploading ${verses.length} tokenized ${bibleIds[i]} verses...`);
    await firebaseBibleMutations.upsertVerses(verses.map(toVerse));
    console.log(`Finished uploading ${bibleIds[i]}`);
  }
}

const [, , ...args] = argv;
const bibleIds = Object.keys(outputFiles).filter(
  (id) => args.length === 0 || args.includes(id),
);

main(bibleIds)
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
