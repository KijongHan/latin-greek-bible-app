import type { BibleStorage, Book, Chapter, Session, Verse } from "@bible-app/domain";
import {
  BOOKS_STORE,
  CHAPTERS_STORE,
  indexedDBRepository,
  SESSIONS_STORE,
  VERSES_STORE,
} from "./indexeddb.repository";

export const indexedDbBibleStorage: BibleStorage = {
  loadBook: (bibleId, book) =>
    indexedDBRepository.load<Book>(`${bibleId}.${book}`, BOOKS_STORE),
  saveBook: (book) => indexedDBRepository.save<Book>(book, BOOKS_STORE),
  loadChapter: (bibleId, chapterId) =>
    indexedDBRepository.load<Chapter>(
      `${bibleId}.${chapterId}`,
      CHAPTERS_STORE,
    ),
  saveChapter: (chapter) =>
    indexedDBRepository.save<Chapter>(chapter, CHAPTERS_STORE),
  loadVerses: async (bibleId, chapterId) => {
    const results = await indexedDBRepository.loadAllByIndex<Verse>(
      VERSES_STORE,
      "bibleChapterId",
      [bibleId, chapterId],
    );
    if (!results || results.length === 0) return undefined;
    return results.sort((a, b) => a.verseNumber - b.verseNumber);
  },
  saveVerses: (verses) =>
    indexedDBRepository.saveMany<Verse>(verses, VERSES_STORE),
  saveSession: (session) =>
    indexedDBRepository.update<Session>(session, SESSIONS_STORE),
  loadAllSessions: () => indexedDBRepository.loadAll<Session>(SESSIONS_STORE),
};
