import type { Timestamp } from "firebase/firestore";
import { type Bible, type Book, type Chapter } from "@bible-app/domain";

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

export const toFirestoreBible = (bible: Bible): FirestoreBibleDoc => ({
  id: bible.id,
  books: bible.books,
  abbreviation: bible.abbreviation,
  name: bible.name,
  language: bible.language,
  description: bible.description,
});

export const toBook = (doc: FirestoreBookDoc): Book => ({
  id: doc.id,
  bibleId: doc.bibleId,
  name: doc.name,
  chapters: doc.chapters,
});

export const toFirestoreBook = (book: Book): FirestoreBookDoc => ({
  bibleId: book.bibleId,
  id: book.id,
  name: book.name,
  chapters: book.chapters,
});

export const toChapter = (doc: FirestoreChapterDoc): Chapter => ({
  id: doc.id,
  bookId: doc.bookId,
  bibleId: doc.bibleId,
  number: doc.number,
  verses: doc.verses,
});

export const toFirestoreChapter = (chapter: Chapter): FirestoreChapterDoc => ({
  bibleId: chapter.bibleId,
  bookId: chapter.bookId,
  id: chapter.id,
  number: chapter.number,
  verses: chapter.verses,
});
