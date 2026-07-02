import type { BibleStorage, Book, Chapter, Session } from "@bible-app/domain";

export const createMemoryBibleStorage = (): BibleStorage => {
  const books = new Map<string, Book>();
  const chapters = new Map<string, Chapter>();
  const sessions = new Map<string, Session>();

  return {
    loadBook: async (bibleId, book) => books.get(`${bibleId}.${book}`),
    saveBook: async (book) => {
      books.set(book.bibleBookId, book);
    },
    loadChapter: async (bibleId, chapterId) =>
      chapters.get(`${bibleId}.${chapterId}`),
    saveChapter: async (chapter) => {
      chapters.set(chapter.bibleChapterId, chapter);
    },
    saveSession: async (session) => {
      sessions.set(session.sessionId, session);
    },
    loadAllSessions: async () => [...sessions.values()],
  };
};
