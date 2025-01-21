import { getDoc, getDocs, query, where } from "firebase/firestore";
import {
  bibleCollection,
  bookRefByBibleBook,
  chapterRefById,
} from "@/lib/repositories/firebase.repository";
import { Bible, Book, Chapter, Session } from "./bible.model";
import {
  BOOKS_STORE,
  CHAPTERS_STORE,
  indexedDBRepository,
  SESSIONS_STORE,
} from "@/lib/repositories/indexeddb.repository";

export const getBibles = async (): Promise<Bible[]> => {
  const q = query(bibleCollection, where("status", "==", "active"));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(
    (doc) =>
      ({
        id: doc.id,
        ...doc.data(),
      } as Bible)
  );
};

export const getAncientBibles = async (): Promise<Bible[]> => {
  const q = query(
    bibleCollection,
    where("language.name", "in", ["Latin", "Greek, Ancient"])
  );
  const querySnapshot = await getDocs(q);
  console.log(querySnapshot.docs);
  querySnapshot.docs.forEach((doc) => {
    console.log(doc.id, " => ", doc.data());
  });
  return querySnapshot.docs.map(
    (doc) =>
      ({
        id: doc.id,
        ...doc.data(),
      } as Bible)
  );
};

export const getEnglishBibles = async (): Promise<Bible[]> => {
  const q = query(bibleCollection, where("language.name", "==", "English"));
  const querySnapshot = await getDocs(q);
  console.log(querySnapshot.docs);
  return querySnapshot.docs.map(
    (doc) =>
      ({
        id: doc.id,
        ...doc.data(),
      } as Bible)
  );
};

export const getBook = async (bibleId: string, book: string): Promise<Book> => {
  const bibleBookId = `${bibleId}.${book}`;
  const cachedBook = await indexedDBRepository.load<Book>(
    bibleBookId,
    BOOKS_STORE
  );
  if (cachedBook) {
    console.log("Cached book not found, fetching from Firebase");
    return cachedBook;
  }

  const bookRef = bookRefByBibleBook(bibleId, book);
  const bookDoc = await getDoc(bookRef);
  const bookResponse = {
    ...bookDoc.data(),
    bibleBookId,
  } as Book;
  await indexedDBRepository.save<Book>(bookResponse, BOOKS_STORE);
  return bookResponse;
};

export const getChapter = async (
  bibleId: string,
  chapterId: string
): Promise<Chapter> => {
  const bibleChapterId = `${bibleId}.${chapterId}`;
  const cachedChapter = await indexedDBRepository.load<Chapter>(
    bibleChapterId,
    CHAPTERS_STORE
  );
  if (cachedChapter) return cachedChapter;
  console.log("Cached chapter not found, fetching from Firebase");

  const chapterRef = chapterRefById(bibleId, chapterId);
  const chapterDoc = await getDoc(chapterRef);
  const chapterResponse = {
    ...chapterDoc.data(),
    bibleChapterId,
  } as Chapter;
  await indexedDBRepository.save<Chapter>(chapterResponse, CHAPTERS_STORE);
  return chapterResponse;
};

export const saveSession = async (session: Session) => {
  console.log("Saving session", session);
  await indexedDBRepository.update<Session>(session, SESSIONS_STORE);
};

export const getSessions = async (): Promise<Session[]> => {
  return await indexedDBRepository.loadAll<Session>(SESSIONS_STORE);
};
