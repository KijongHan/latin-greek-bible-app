import * as fs from "node:fs/promises";
import {
  bibleCollection,
  booksCollection,
  chaptersCollection,
} from "../shared";
import { bookIdLookup } from "@bible-app/domain";
import { Bible } from "./types";

const bibleIdsToParse = [
  "ASV",
  "BSB",
  "Byz",
  "kjv",
  "TR",
  "DRC",
  "VulgClementine",
  "WEB",
] as const;

async function parseBibleData(bibleId: string) {
  console.log(`Parsing bible ${bibleId}...`);
  const content = await fs.readFile(
    `../../vendor/bible_databases/formats/json/${bibleId}.json`,
    "utf-8",
  );

  const data: Bible = JSON.parse(content);
  for (const book of data.books) {
    const bookId = bookIdLookup.get(book.name);

    const bookData = {
      bibleId: bibleId,
      id: bookId,
      name: book.name,
      chapters: book.chapters.map((chapter) => `${bookId}.${chapter.chapter}`),
    };
    const bookRef = doc(booksCollection, `${bibleId}.${bookId}`);
    await setDoc(bookRef, bookData);

    for (const chapter of book.chapters) {
      const chapterId = `${bookId}.${chapter.chapter}`;
      const chapterData = {
        bookId: bookId,
        bibleId: bibleId,
        id: chapterId,
        number: chapter.chapter,
        verses: chapter.verses.map((verse) => ({
          id: `${chapterId}.${verse.verse}`,
          text: verse.text,
        })),
      };
      const chapterRef = doc(chaptersCollection, `${bibleId}.${chapterId}`);
      await setDoc(chapterRef, chapterData);
    }
  }
}

console.log("Parsing bibles...");
bibleIdsToParse.forEach((bibleId) => {
  parseBibleData(bibleId);
});
