import { Book, Chapter, ChapterAudio, Session, Verse } from "../types";

export interface BibleStorage {
  loadBook(bibleId: string, book: string): Promise<Book | undefined>;
  saveBook(book: Book): Promise<void>;
  loadChapter(bibleId: string, chapterId: string): Promise<Chapter | undefined>;
  saveChapter(chapter: Chapter): Promise<void>;
  loadVerses(
    bibleId: string,
    chapterId: string,
  ): Promise<Verse[] | undefined>;
  saveVerses(verses: Verse[]): Promise<void>;
  saveSession(session: Session): Promise<void>;
  loadAllSessions(): Promise<Session[]>;
}

export interface BibleAudioStorage {
  loadChapterAudio(
    bibleId: string,
    chapterId: string
  ): Promise<ChapterAudio | undefined>;
  saveChapterAudio(audio: ChapterAudio): Promise<void>;
}
