import { Chapter, Verse } from "./types";

export interface ChapterQueries {
  getChapter(bibleId: string, chapterId: string): Promise<Chapter>;
  getVerses(bibleId: string, chapterId: string): Promise<Verse[]>;
}

export interface ChapterMutations {
  upsertChapter(chapter: Chapter): Promise<void>;
  upsertChapters(chapters: Chapter[]): Promise<void>;
  upsertVerse(verse: Verse): Promise<void>;
  upsertVerses(verses: Verse[]): Promise<void>;
}

export interface ChapterStorage {
  loadChapter(bibleId: string, chapterId: string): Promise<Chapter | undefined>;
  saveChapter(chapter: Chapter): Promise<void>;
  loadVerses(bibleId: string, chapterId: string): Promise<Verse[] | undefined>;
  saveVerses(verses: Verse[]): Promise<void>;
}
