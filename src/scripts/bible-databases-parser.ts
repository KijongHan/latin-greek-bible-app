import { createHash, hash } from "node:crypto";
import { initializeApp } from "firebase/app";
import * as fs from "node:fs/promises";
import {
  addDoc,
  collection,
  doc,
  getFirestore,
  setDoc,
} from "firebase/firestore";

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

const firebaseConfig = {
  apiKey: "AIzaSyAINhGcCv_D-meQhYryEEsm5qLmRMApfX0",
  authDomain: "bible-app-4ea8f.firebaseapp.com",
  projectId: "bible-app-4ea8f",
  storageBucket: "bible-app-4ea8f.firebasestorage.app",
  messagingSenderId: "1052050185148",
  appId: "1:1052050185148:web:93778e8f126d9e85a329b9",
  measurementId: "G-3FD1WCMH6P",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const bibleCollection = collection(db, "bibles");
const booksCollection = collection(db, "books");
const chaptersCollection = collection(db, "chapters");

function generateSHA1Truncated(message: string, length: number = 16): string {
  return createHash("sha1").update(message).digest("hex").substring(0, length);
}

async function parseKJV() {
  const bibleId = "de4e12af7f28f599-02";
  const content = await fs.readFile(
    `C:/Users/thoma/Software/bible_databases/formats/json/kjv.json`,
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
  const books = data.books
    .map((book) => bookNameToIdMap.find((b) => b.name === book.name))
    .filter((book) => book !== undefined);
  for (const book of data.books) {
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

async function main() {
  const bible = "Vulgate";
  const content = await fs.readFile(
    `C:/Users/thoma/Software/bible_databases/formats/json/${bible}.json`,
    "utf-8"
  );
  const hash = generateSHA1Truncated(content);
  const bibleId = `${hash}-01`;
  const bibleMetadata = {
    dblId: hash,
    abbreviation: "Vulgate",
    name: "Latin Vulgate",
    language: {
      name: "Latin",
      script: "Latin",
      id: "la",
    },
    type: "text",
  };

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
  const books = data.books
    .map((book) => bookNameToIdMap.find((b) => b.name === book.name))
    .filter((book) => book !== undefined);
  console.log(books);
  for (const book of data.books) {
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

  //   const bibleRef = doc(bibleCollection, `${id}`);
  //   await setDoc(bibleRef, {
  //     ...bibleMetadata,
  //     books: books,
  //     createdAt: new Date(),
  //   });
  console.log(data.books[0].chapters[0]);
}

// main();
parseKJV();
