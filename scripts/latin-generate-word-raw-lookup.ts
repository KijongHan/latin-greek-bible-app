import { initializeApp } from "firebase/app";
import { collection, doc, getDoc, getFirestore } from "firebase/firestore";
import * as fs from "node:fs/promises";
import { setTimeout } from "node:timers/promises";

import {
  bibleCollection,
  booksCollection,
  chaptersCollection,
  ChapterTranslations,
  firebaseConfig,
  genderMappings,
  partMappings,
} from "./shared";

async function main() {
  console.log("Getting bible...");
  const bibleId = "ff5199704bbd50de-01";
  const bibleRef = doc(bibleCollection, bibleId);
  const bible = await getDoc(bibleRef);
  const bibleData = bible.data();
  if (!bibleData) {
    console.error("Bible not found");
    return;
  }
  console.log("Bible found");
  console.log(bibleData);

  const rawLookup: Record<string, string> = JSON.parse(
    await fs.readFile(
      `C:\\Users\\thoma\\Software\\Bible\\data\\wordOccurrences\\latin-word-raw-lookup.json`,
      "utf8"
    )
  );

  let skip = true;
  for (const b of bibleData.books) {
    if (b === "MAT") skip = false;
    if (skip) continue;

    const bookId = `${bibleId}.${b}`;
    const bookRef = doc(booksCollection, bookId);
    const book = await getDoc(bookRef);
    const bookData = book.data();
    if (!bookData) {
      console.error("Book not found");
      continue;
    }
    console.log(bookData);

    for (const c of bookData.chapters) {
      const chapterRef = doc(chaptersCollection, `${bibleId}.${c}`);
      const chapter = await getDoc(chapterRef);
      const chapterData = chapter.data();
      console.log(chapterData);

      if (!chapterData) {
        console.error("Chapter not found");
        continue;
      }

      let alreadyExistingWords = 0;
      let newWords = 0;
      for (const v of chapterData.verses) {
        const words = v.text.split(" ");
        for (const word of words) {
          if (rawLookup[word] !== undefined) {
            alreadyExistingWords++;
            continue;
          }
          if (rawLookup[word] === "") {
            continue;
          }

          newWords++;
          const response = await fetch(
            `https://latin-words.com/cgi-bin/translate.cgi?query=${word}`
          ).then((res) => res.json());

          console.log(response);
          const raw = response.message;
          rawLookup[word] = raw;
        }
      }

      console.log(`${bibleId}.${c} done`);
      console.log(`already existing words: ${alreadyExistingWords}`);
      console.log(`new words: ${newWords}`);
      console.log("Writing to file... for chapter ", c);
      await fs.writeFile(
        `C:/Users/thoma/Software/Bible/data/wordOccurrences/latin-word-raw-lookup.json`,
        JSON.stringify(rawLookup, null, 2)
      );
      await setTimeout(2000);
    }
  }
}

main();
