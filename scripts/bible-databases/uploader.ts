import {
  toBook,
  toChapter,
  toVerse,
} from "../../packages/infrastructure/firebase/src/firebase.bible.dto";
import { bibleIdsToParse } from "./constants";
import { parseBibleData } from "./parser";
import { firebaseBibleMutations } from "@bible-app/firebase";

async function main() {
  const data = await Promise.all(bibleIdsToParse.map(parseBibleData));

  for (const bibleData of data) {
    if (!bibleData) {
      console.error("Invalid bible data", bibleData);
      continue;
    }

    const { bible, books, chapters, verses } = bibleData;
    if (!bible || !books || !chapters || !verses) {
      console.error("Invalid bible data", { bible, books, chapters, verses });
      return;
    }

    console.log(`Uploading bible ${bible.name}`);
    await firebaseBibleMutations.upsertBible(bible);

    for (const book of books) {
      await firebaseBibleMutations.upsertBook(toBook(book));
    }
    console.log(`Uploaded ${books.length} books`);

    console.log(`Batch-uploading ${chapters.length} chapters...`);
    await firebaseBibleMutations.upsertChapters(chapters.map(toChapter));

    console.log(`Batch-uploading ${verses.length} verses...`);
    await firebaseBibleMutations.upsertVerses(verses.map(toVerse));

    console.log(`Finished uploading bible ${bible.name}`);
  }
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
