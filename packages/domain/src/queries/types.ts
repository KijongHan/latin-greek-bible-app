import { Bible, Book, Chapter, ChapterAudio } from "../models/bible";

export interface BibleQueries {
  getBibles(): Promise<Bible[]>;
  getBook(bibleId: string, book: string): Promise<Book>;
  getChapter(bibleId: string, chapterId: string): Promise<Chapter>;
}

export interface AudioQueries {
  getChapterAudio(bibleId: string, chapterId: string): Promise<ChapterAudio>;
}