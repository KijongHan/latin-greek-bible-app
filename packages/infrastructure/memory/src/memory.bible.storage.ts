import {
  getBookRecordKey,
  getChapterRecordKey,
  type BibleStorage,
  type Book,
  type Chapter,
  type Session,
} from "@bible-app/domain";

export const createMemoryBibleStorage = (): BibleStorage => {
  const books = new Map<string, Book>();
  const chapters = new Map<string, Chapter>();
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
    saveSession: async (session) => {
      sessions.set(session.sessionId, session);
    },
    loadAllSessions: async () => [...sessions.values()],
  };
};
