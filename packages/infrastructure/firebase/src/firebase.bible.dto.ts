import type { Timestamp } from "firebase/firestore";
import type { Bible, Book, Chapter } from "@bible-app/domain";

export interface FirestoreBibleDoc {
  books: string[];
  abbreviation: string;
  abbreviationLocal?: string;
  name: string;
  language: { id: string; name: string };
  description?: string;
  status?: string;
  updatedAt?: Timestamp;
}

export interface FirestoreBookDoc {
  bibleId: string;
  id: string;
  name: string;
  nameLong?: string;
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
  language: doc.language.id,
  description: doc.description,
});

export const toBook = (
  bibleId: string,
  bookId: string,
  doc: FirestoreBookDoc
): Book => ({
  bibleBookId: `${bibleId}.${bookId}`,
  id: bookId,
  bibleId,
  name: doc.name,
  nameLong: doc.nameLong ?? doc.name,
  chapters: doc.chapters,
});

export const toChapter = (
  bibleId: string,
  chapterId: string,
  doc: FirestoreChapterDoc
): Chapter => ({
  bibleChapterId: `${bibleId}.${chapterId}`,
  id: chapterId,
  bookId: doc.bookId,
  bibleId,
  number: doc.number,
  verses: doc.verses,
});
