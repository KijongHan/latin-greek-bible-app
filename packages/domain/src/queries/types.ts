import { Bible, Book, Chapter, ChapterAudio, Verse } from "../types";

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
