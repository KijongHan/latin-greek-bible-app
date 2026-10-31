import {
  Bible,
  Book,
  Chapter,
  ChapterAudio,
  AnyLexiconEntry,
  Verse,
} from "../types";

export interface BibleMutations {
  upsertBible(bible: Bible): Promise<void>;
  upsertBook(book: Book): Promise<void>;
  upsertChapter(chapter: Chapter): Promise<void>;
  upsertChapters(chapters: Chapter[]): Promise<void>;
  upsertVerse(verse: Verse): Promise<void>;
  upsertVerses(verses: Verse[]): Promise<void>;
}

export interface BibleQueries {
  getBibles(): Promise<Bible[]>;
  getBook(bibleId: string, bookId: string): Promise<Book>;
  getChapter(bibleId: string, chapterId: string): Promise<Chapter>;
  getVerses(bibleId: string, chapterId: string): Promise<Verse[]>;
}

export interface AudioQueries {
  getChapterAudio(bibleId: string, chapterId: string): Promise<ChapterAudio>;
}

export interface LexiconQueries {
  // Entries for these ids; ids with no entry are left out
  getLexiconEntries(ids: string[]): Promise<AnyLexiconEntry[]>;
}
