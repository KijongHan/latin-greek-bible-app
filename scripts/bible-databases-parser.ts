import { createHash, hash } from "node:crypto";
import { initializeApp } from "firebase/app";
import * as fs from "node:fs/promises";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getFirestore,
  setDoc,
} from "firebase/firestore";
import { bibleCollection, booksCollection, chaptersCollection } from "./shared";

const bookNameToIdMap = [
  {
    id: "GEN",
    name: "Genesis",
  },
  {
    id: "EXO",
    name: "Exodus",
  },
  {
    id: "LEV",
    name: "Leviticus",
  },
  {
    id: "NUM",
    name: "Numbers",
  },
  {
    id: "DEU",
    name: "Deuteronomy",
  },
  {
    id: "JOS",
    name: "Joshua",
  },
  {
    id: "JDG",
    name: "Judges",
  },
  {
    id: "RUT",
    name: "Ruth",
  },
  {
    id: "1SA",
    name: "I Samuel",
  },
  {
    id: "2SA",
    name: "II Samuel",
  },
  {
    id: "1KI",
    name: "I Kings",
  },
  {
    id: "2KI",
    name: "II Kings",
  },
  {
    id: "1CH",
    name: "I Chronicles",
  },
  {
    id: "2CH",
    name: "II Chronicles",
  },
  {
    id: "EZR",
    name: "Ezra",
  },
  {
    id: "NEH",
    name: "Nehemiah",
  },
  {
    id: "EST",
    name: "Esther",
  },
  {
    id: "JOB",
    name: "Job",
  },
  {
    id: "PSA",
    name: "Psalms",
  },
  {
    id: "PRO",
    name: "Proverbs",
  },
  {
    id: "ECC",
    name: "Ecclesiastes",
  },
  {
    id: "SNG",
    name: "Song of Solomon",
  },
  {
    id: "ISA",
    name: "Isaiah",
  },
  {
    id: "JER",
    name: "Jeremiah",
  },
  {
    id: "LAM",
    name: "Lamentations",
  },
  {
    id: "EZK",
    name: "Ezekiel",
  },
  {
    id: "DAN",
    name: "Daniel",
  },
  {
    id: "HOS",
    name: "Hosea",
  },
  {
    id: "JOL",
    name: "Joel",
  },
  {
    id: "AMO",
    name: "Amos",
  },
  {
    id: "OBA",
    name: "Obadiah",
  },
  {
    id: "JON",
    name: "Jonah",
  },
  {
    id: "MIC",
    name: "Micah",
  },
  {
    id: "NAM",
    name: "Nahum",
  },
  {
    id: "HAB",
    name: "Habakkuk",
  },
  {
    id: "ZEP",
    name: "Zephaniah",
  },
  {
    id: "HAG",
    name: "Haggai",
  },
  {
    id: "ZEC",
    name: "Zechariah",
  },
  {
    id: "MAL",
    name: "Malachi",
  },
  {
    id: "MAT",
    name: "Matthew",
  },
  {
    id: "MRK",
    name: "Mark",
  },
  {
    id: "LUK",
    name: "Luke",
  },
  {
    id: "JHN",
    name: "John",
  },
  {
    id: "ACT",
    name: "Acts",
  },
  {
    id: "ROM",
    name: "Romans",
  },
  {
    id: "1CO",
    name: "I Corinthians",
  },
  {
    id: "2CO",
    name: "II Corinthians",
  },
  {
    id: "GAL",
    name: "Galatians",
  },
  {
    id: "EPH",
    name: "Ephesians",
  },
  {
    id: "PHP",
    name: "Philippians",
  },
  {
    id: "COL",
    name: "Colossians",
  },
  {
    id: "1TH",
    name: "I Thessalonians",
  },
  {
    id: "2TH",
    name: "II Thessalonians",
  },
  {
    id: "1TI",
    name: "I Timothy",
  },
  {
    id: "2TI",
    name: "II Timothy",
  },
  {
    id: "TIT",
    name: "Titus",
  },
  {
    id: "PHM",
    name: "Philemon",
  },
  {
    id: "HEB",
    name: "Hebrews",
  },
  {
    id: "JAS",
    name: "James",
  },
  {
    id: "1PE",
    name: "I Peter",
  },
  {
    id: "2PE",
    name: "II Peter",
  },
  {
    id: "1JN",
    name: "I John",
  },
  {
    id: "2JN",
    name: "II John",
  },
  {
    id: "3JN",
    name: "III John",
  },
  {
    id: "JUD",
    name: "Jude",
  },
  {
    id: "REV",
    name: "Revelation of John",
  },
  {
    id: "TOB",
    name: "Tobit",
  },
  {
    id: "JDT",
    name: "Judith",
  },
  {
    id: "WIS",
    name: "Wisdom",
  },
  {
    id: "SIR",
    name: "Sirach",
  },
  {
    id: "BAR",
    name: "Baruch",
  },
  {
    id: "1MA",
    name: "I Maccabees",
  },
  {
    id: "2MA",
    name: "II Maccabees",
  },
  {
    id: "MAN",
    name: "Prayer of Manasses",
  },
  {
    id: "1ES",
    name: "I Esdras",
  },
  {
    id: "2ES",
    name: "II Esdras",
  },
  {
    id: "PS2",
    name: "Additional Psalm",
  },
  {
    id: "LAO",
    name: "Laodiceans",
  },
];

const apocrypha = ["MAN", "1ES", "2ES", "PS2", "LAO"];

function generateSHA1Truncated(message: string, length: number = 16): string {
  return createHash("sha1").update(message).digest("hex").substring(0, length);
}

const bibles: [string, string][] = [
  ["kjv", "de4e12af7f28f599-02"],
  ["TR", "3aefb10641485092-01"],
  ["DRC", "5aefb10641485021-01"],
  ["VulgClementine", "1b111f1ed7f111a6-01"],
];

const bibleLookup: Record<string, {}> = {
  DRC: {
    id: "5aefb10641485021-01",
    books: bookNameToIdMap.map((b) => b.id),
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
    books: bookNameToIdMap
      .map((b) => b.id)
      .filter((b) => !apocrypha.includes(b)),
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
    if (
      !bibleData.books.includes(
        bookNameToIdMap.find((b) => b.name === book.name)?.id
      )
    ) {
      console.log(`Book ${book.name} not found in bible ${bible}`);
      continue;
    }

    console.log(`Book ${book.name} found in bible ${bible} - uploading...`);
    const bookId = bookNameToIdMap.find((b) => b.name === book.name)?.id;
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
