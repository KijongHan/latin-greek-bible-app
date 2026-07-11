import type { Timestamp } from "firebase/firestore";
import { type Bible, type Book, type Chapter } from "@bible-app/domain";
import { getBookRecordKey } from "./firebase.utils";

export interface FirestoreBibleDoc {
  id: string;
  books: string[];
  abbreviation: string;
  name: string;
  language: string;
  description?: string;
  status?: string;
  updatedAt?: Timestamp;
}

export interface FirestoreBookDoc {
  bibleId: string;
  id: string;
  name: string;
  chapters: string[];
  createdAt?: Timestamp;
}

export interface FirestoreChapterDoc {
  bibleId: string;
  bookId: string;
  id: string;
  number: number;
  verses: { id: string; text: string | string[] }[];
  createdAt?: Timestamp;
}

export const toBible = (id: string, doc: FirestoreBibleDoc): Bible => ({
  id,
  books: doc.books,
  abbreviation: doc.abbreviation,
  name: doc.name,
  language: doc.language,
  description: doc.description,
});

export const toBook = (
  bibleId: string,
  bookId: string,
  doc: FirestoreBookDoc,
): Book => ({
  bibleBookId: getBookRecordKey(bibleId, bookId),
  id: bookId,
  bibleId,
  name: doc.name,
  chapters: doc.chapters,
});

export const toChapter = (
  bibleId: string,
  chapterId: string,
  doc: FirestoreChapterDoc,
): Chapter => ({
  bibleChapterId: `${bibleId}.${chapterId}`,
  id: chapterId,
  bookId: doc.bookId,
  bibleId,
  number: doc.number,
  verses: doc.verses,
});
