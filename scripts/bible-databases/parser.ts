import * as fs from "node:fs/promises";
import {
  doc,
  getDoc,
  setDoc,
} from "firebase/firestore";
import { bibleCollection, booksCollection, chaptersCollection } from "../shared";
import { bookIds, bookNameToIdLookup } from "@bible-app/domain";

const bibles: [string, string][] = [
  ["kjv", "de4e12af7f28f599-02"],
  ["TR", "3aefb10641485092-01"],
  ["DRC", "5aefb10641485021-01"],
  ["VulgClementine", "1b111f1ed7f111a6-01"],
];

const bibleLookup: Record<string, {}> = {
  DRC: {
    id: "5aefb10641485021-01",
    books: bookIds,
    abbreviation: "DRC",
    abbreviationLocal: "DRC",
    name: "Douay-Rheims",
    language: {
      id: "eng",
      name: "English",
    },
    updatedAt: new Date(),
  },
  VulgClementine: {
    id: "1b111f1ed7f111a6-01",
    books: bookIds,
    abbreviation: "CLVLG",
    abbreviationLocal: "CLVLG",
    name: "Clementine Vulgate",
    language: {
      id: "la",
      name: "Latin",
    },
  },
};

async function uploadBibleData([bible, bibleId]: [string, string]) {
  console.log("Getting bible...");
  const bibleRef = doc(bibleCollection, bibleId);
  const bibleDoc = await getDoc(bibleRef);
  const bibleData = bibleDoc.data();
  if (!bibleData) {
    console.error("Bible not found");
    await setDoc(bibleRef, bibleLookup[bible]);
    return;
  }

  const content = await fs.readFile(
    `C:/Users/thoma/Software/bible_databases/formats/json/${bible}.json`,
    "utf-8"
  );

  const data: {
    books: {
      name: string;
      chapters: {
        chapter: number;
        verses: {
          verse: number;
          text: string;
        }[];
      }[];
    }[];
  } = JSON.parse(content);
  for (const book of data.books) {
    const bookId = bookNameToIdLookup.get(book.name);
    if (!bibleData.books.includes(bookId)) {
      console.log(`Book ${book.name} not found in bible ${bible}`);
      continue;
    }

    console.log(`Book ${book.name} found in bible ${bible} - uploading...`);
    const bookData = {
      bibleId: bibleId,
      id: bookId,
      name: book.name,
      chapters: book.chapters.map((chapter) => `${bookId}.${chapter.chapter}`),
      createdAt: new Date(),
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
        createdAt: new Date(),
      };
      const chapterRef = doc(chaptersCollection, `${bibleId}.${chapterId}`);
      await setDoc(chapterRef, chapterData);
    }
  }
}

// main();
uploadBibleData(bibles[3]);
