import {
  toBook,
  toChapter,
} from "../../packages/infrastructure/firebase/src/firebase.bible.dto";
import { bibleIdsToParse } from "./constants";
import { parseBibleData } from "./parser";
import { firebaseBibleMutations } from "@bible-app/firebase";

async function main() {
  const data = await Promise.all(bibleIdsToParse.map(parseBibleData));
  const totalChapters = data.reduce((acc, bibleData) => {
    return acc + (bibleData?.chapters?.length ?? 0);
  }, 0);

  let currentChapter = 0;
  for (const bibleData of data) {
    if (!bibleData) {
      console.error("Invalid bible data", bibleData);
      continue;
    }

    const { bible, books, chapters } = bibleData;
    if (!bible || !books || !chapters) {
      console.error("Invalid bible data", { bible, books, chapters });
      return;
    }

    console.log("Uploading bible", bible.name);
    await firebaseBibleMutations.upsertBible(bible);

    for (const book of books) {
      console.log("Uploading book", book.name);
      await firebaseBibleMutations.upsertBook(toBook(book));
    }

    for (const chapter of chapters) {
      console.log(
        "Uploading chapter",
        `${bible.name} ${chapter.bookId} ${chapter.number}`,
      );
      await firebaseBibleMutations.upsertChapter(toChapter(chapter));

      currentChapter++;
      console.log(`${currentChapter}/${totalChapters} chapters uploaded`);
    }
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
