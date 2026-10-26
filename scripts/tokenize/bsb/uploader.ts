import * as fs from "node:fs/promises";
import {
  toVerse,
  type FirestoreVerseDoc,
} from "../../../packages/infrastructure/firebase/src/firebase.bible.dto";
import { firebaseBibleMutations } from "@bible-app/firebase";

const OUTPUT_FILE_URL = "./output/BSB.json";

async function main() {
  const content = await fs.readFile(
    new URL(OUTPUT_FILE_URL, import.meta.url),
    "utf-8",
  );
  const verses: FirestoreVerseDoc[] = JSON.parse(content);

  console.log(`Batch-uploading ${verses.length} tokenized BSB verses...`);
  await firebaseBibleMutations.upsertVerses(verses.map(toVerse));
  console.log("Finished uploading BSB");
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
