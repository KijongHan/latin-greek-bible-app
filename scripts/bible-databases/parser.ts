import * as fs from "node:fs/promises";
import { getBookId, getChapterId, getVerseId } from "@bible-app/domain";
import { Bible } from "./types";
import {
  bibleBooksLookup,
  bibleDescriptionsLookup,
  bibleLanguagesLookup,
  bibleNameLookup,
} from "./constants";
import {
  FirestoreBibleDoc,
  FirestoreBookDoc,
  FirestoreChapterDoc,
} from "@bible-app/firebase";

export async function parseBibleData(bibleId: string) {
  console.log(`Parsing bible ${bibleId}...`);
  const content = await fs.readFile(
    new URL(
      `../../vendor/bible-databases/formats/json/${bibleId}.json`,
      import.meta.url,
    ),
    "utf-8",
  );

  const data: Bible = JSON.parse(content);
  const books: FirestoreBookDoc[] = [];
  const chapters: FirestoreChapterDoc[] = [];

  const bibleName = bibleNameLookup.get(bibleId);
  const bibleLanguage = bibleLanguagesLookup.get(bibleId);

  if (!bibleName) {
    console.log(`Bible ${bibleId} not found in bibleNameLookup`);
    return null;
  }
  if (!bibleLanguage) {
    console.log(`Bible ${bibleId} not found in bibleLanguagesLookup`);
    return null;
  }

  const bible: FirestoreBibleDoc = {
    id: bibleId,
    abbreviation: bibleId,
    books: data.books.map((book) => book.name),
    name: bibleName,
    language: bibleLanguage,
    description: bibleDescriptionsLookup.get(bibleId),
  };

  for (const book of data.books) {
    const bookId = getBookId(book.name);
    if (!bookId) {
      console.log(`Book ${book.name} not found in bible ${bibleId}`);
      continue;
    }
    if (!bibleBooksLookup.get(bibleId)?.includes(bookId)) {
      console.log(`Book ${bookId} not found in lookup ${bibleId}`);
      continue;
    }

    books.push({
      bibleId: bibleId,
      id: bookId,
      name: book.name,
      chapters: book.chapters.map((chapter) =>
        getChapterId(bookId, chapter.chapter),
      ),
    });

    for (const chapter of book.chapters) {
      const chapterId = getChapterId(bookId, chapter.chapter);
      const chapterData = {
        bookId: bookId,
        bibleId: bibleId,
        id: chapterId,
        number: chapter.chapter,
        verses: chapter.verses.map((verse) => ({
          id: getVerseId(bookId, chapter.chapter, verse.verse),
          text: verse.text,
        })),
      };
      chapters.push(chapterData);
    }
  }

  await fs.writeFile(
    new URL(`output/bibles/${bibleId}.json`, import.meta.url),
    JSON.stringify(bible, null, 2),
  );
  await fs.writeFile(
    new URL(`output/books/${bibleId}.json`, import.meta.url),
    JSON.stringify(books, null, 2),
  );
  await fs.writeFile(
    new URL(`output/chapters/${bibleId}.json`, import.meta.url),
    JSON.stringify(chapters, null, 2),
  );

  return {
    bible,
    books,
    chapters,
  };
}

await fs.mkdir(new URL("output/bibles", import.meta.url), { recursive: true });
await fs.mkdir(new URL("output/books", import.meta.url), { recursive: true });
await fs.mkdir(new URL("output/chapters", import.meta.url), {
  recursive: true,
});
