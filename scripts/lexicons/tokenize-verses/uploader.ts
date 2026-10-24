import * as fs from "node:fs/promises";
import { argv } from "node:process";
import {
  toVerse,
  type FirestoreVerseDoc,
} from "../../../packages/infrastructure/firebase/src/firebase.bible.dto";
import { firebaseBibleMutations } from "@bible-app/firebase";
import { bibleEditions } from "./tokenize-verses-file";

const OUTPUT_DIR_URL = "./output/";

async function main(bibleIds: string[]) {
  for (const bibleId of bibleIds) {
    const content = await fs.readFile(
      new URL(`${OUTPUT_DIR_URL}${bibleId}.json`, import.meta.url),
      "utf-8",
    );
    const verses: FirestoreVerseDoc[] = JSON.parse(content);

    console.log(`Batch-uploading ${verses.length} tokenized ${bibleId} verses...`);
    await firebaseBibleMutations.upsertVerses(verses.map(toVerse));
    console.log(`Finished uploading ${bibleId}`);
  }
}

const [, , ...args] = argv;
const bibleIds = Object.keys(bibleEditions).filter(
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
