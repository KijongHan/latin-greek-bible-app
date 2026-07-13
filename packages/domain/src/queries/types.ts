import { Bible, Book, Chapter, ChapterAudio } from "../types";

export interface BibleMutations {
  upsertBible(bible: Bible): Promise<void>;
  upsertBook(book: Book): Promise<void>;
  upsertChapter(chapter: Chapter): Promise<void>;
}

export interface BibleQueries {
  getBibles(): Promise<Bible[]>;
  getBook(bibleId: string, book: string): Promise<Book>;
  getChapter(bibleId: string, chapterId: string): Promise<Chapter>;
}

export interface AudioQueries {
  getChapterAudio(bibleId: string, chapterId: string): Promise<ChapterAudio>;
}
