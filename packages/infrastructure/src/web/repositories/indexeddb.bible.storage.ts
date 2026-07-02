import type { BibleStorage, Book, Chapter, Session } from "@bible-app/domain";
import {
  BOOKS_STORE,
  CHAPTERS_STORE,
  SESSIONS_STORE,
  indexedDBRepository,
} from "./indexeddb.repository";

export const indexedDbBibleStorage: BibleStorage = {
  loadBook: (bibleId, book) =>
    indexedDBRepository.load<Book>(`${bibleId}.${book}`, BOOKS_STORE),
  saveBook: (book) => indexedDBRepository.save<Book>(book, BOOKS_STORE),
  loadChapter: (bibleId, chapterId) =>
    indexedDBRepository.load<Chapter>(`${bibleId}.${chapterId}`, CHAPTERS_STORE),
  saveChapter: (chapter) =>
    indexedDBRepository.save<Chapter>(chapter, CHAPTERS_STORE),
  saveSession: (session) =>
    indexedDBRepository.update<Session>(session, SESSIONS_STORE),
  loadAllSessions: () => indexedDBRepository.loadAll<Session>(SESSIONS_STORE),
};
