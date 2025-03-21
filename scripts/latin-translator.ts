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

  const wordLookup: Record<string, number> = JSON.parse(
    await fs.readFile(
      `C:\\Users\\thoma\\Software\\Bible\\data\\wordOccurrences\\latin-word-lookup.json`,
      "utf8"
    )
  );
  console.log(wordLookup);

  for (const b of bibleData.books) {
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
      if (c === "GEN.1") continue;
      if (c === "GEN.2") continue;

      let rawChapterTranslationsMap: ChapterTranslations = [];
      const chapterRef = doc(chaptersCollection, `${bibleId}.${c}`);
      const chapter = await getDoc(chapterRef);
      const chapterData = chapter.data();
      console.log(chapterData);

      if (!chapterData) {
        console.error("Chapter not found");
        continue;
      }

      for (const v of chapterData.verses) {
        const words = v.text.split(" ");
        const wordTranslations: {
          word: string;
          translation: { part: string; gender: string; definitions: string[] };
          raw: string;
        }[] = [];
        for (const word of words) {
          if (wordLookup[word] !== undefined) continue;

          const response = await fetch(
            `https://latin-words.com/cgi-bin/translate.cgi?query=${word}`
          ).then((res) => res.json());
          console.log(response);
          const lines: string[] = response.message.split("\n");
          const firstLine: string[] = lines[0].split(" ");
          const raw = response.message;
          const part =
            firstLine
              .splice(1)
              .find((e) => partMappings[e] !== undefined)?.[0] || "";
          const gender =
            firstLine
              .splice(1)
              .find((e) => genderMappings[e] !== undefined)?.[0] || "";
          const definitions =
            lines.find((e) => e.endsWith(";"))?.split(";") || [];
          wordTranslations.push({
            word,
            translation: { part, gender, definitions },
            raw,
          });
          console.log(wordTranslations);
        }
        rawChapterTranslationsMap.push({
          verseId: v.id,
          wordTranslations,
        });
      }
      await fs.writeFile(
        `C:/Users/thoma/Software/Bible/data/translations/${bibleId}.${c}.json`,
        JSON.stringify(rawChapterTranslationsMap, null, 2)
      );
      await setTimeout(3000);
    }
    break;
  }
}

main();
