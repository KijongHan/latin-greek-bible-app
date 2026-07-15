import type { Timestamp } from "firebase/firestore";
import {
  getBookId,
  getBookRecordKey,
  getChapterRecordKey,
  getVerseRecordKey,
  type Bible,
  type Book,
  type Chapter,
  type Token,
  type Verse,
} from "@bible-app/domain";

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
  verses: string[];
  createdAt?: Timestamp;
}

export interface FirestoreVerseDoc {
  bibleId: string;
  bookId: string;
  chapterId: string;
  id: string;
  verseNumber: number;
  tokens: Token[];
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
  bookRecordKey: getBookRecordKey(doc.bibleId, doc.id),
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
  chapterRecordKey: getChapterRecordKey(doc.bibleId, doc.id),
});

export const toFirestoreChapter = (chapter: Chapter): FirestoreChapterDoc => ({
  bibleId: chapter.bibleId,
  bookId: chapter.bookId,
  id: chapter.id,
  number: chapter.number,
  verses: chapter.verses,
});

export const toVerse = (doc: FirestoreVerseDoc): Verse => ({
  id: doc.id,
  bibleId: doc.bibleId,
  bookId: doc.bookId,
  chapterId: doc.chapterId,
  verseNumber: doc.verseNumber,
  tokens: doc.tokens,
  verseRecordKey: getVerseRecordKey(doc.bibleId, doc.id),
});

export const toFirestoreVerse = (verse: Verse): FirestoreVerseDoc => ({
  bibleId: verse.bibleId,
  bookId: verse.bookId,
  chapterId: verse.chapterId,
  id: verse.id,
  verseNumber: verse.verseNumber,
  tokens: verse.tokens,
});
