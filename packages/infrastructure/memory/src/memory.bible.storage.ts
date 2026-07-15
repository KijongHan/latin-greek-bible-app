import {
  getBookRecordKey,
  getChapterRecordKey,
  type BibleStorage,
  type Book,
  type Chapter,
  type Session,
  type Verse,
} from "@bible-app/domain";

export const createMemoryBibleStorage = (): BibleStorage => {
  const books = new Map<string, Book>();
  const chapters = new Map<string, Chapter>();
  const verses = new Map<string, Verse[]>();
  const sessions = new Map<string, Session>();

  return {
    loadBook: async (bibleId, book) =>
      books.get(getBookRecordKey(bibleId, book)),
    saveBook: async (book) => {
      books.set(getBookRecordKey(book.bibleId, book.id), book);
    },
    loadChapter: async (bibleId, chapterId) =>
      chapters.get(getChapterRecordKey(bibleId, chapterId)),
    saveChapter: async (chapter) => {
      chapters.set(getChapterRecordKey(chapter.bibleId, chapter.id), chapter);
    },
    loadVerses: async (bibleId, chapterId) =>
      verses.get(getChapterRecordKey(bibleId, chapterId)),
    saveVerses: async (versesToSave) => {
      if (versesToSave.length === 0) return;
      const first = versesToSave[0];
      verses.set(
        getChapterRecordKey(first.bibleId, first.chapterId),
        [...versesToSave].sort((a, b) => a.verseNumber - b.verseNumber),
      );
    },
    saveSession: async (session) => {
      sessions.set(session.sessionId, session);
    },
    loadAllSessions: async () => [...sessions.values()],
  };
};
