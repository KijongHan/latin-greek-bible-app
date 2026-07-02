import { getDoc, getDocs, query, where } from "firebase/firestore";
import {
  bibleCollection,
  bookRefByBibleBook,
  chapterRefById,
} from "../repositories/firebase.repository";
import type { Bible, BibleQueries, Book, Chapter } from "@bible-app/domain";

export const firebaseBibleQueries: BibleQueries = {
  getBibles: async () => {
    const q = query(bibleCollection, where("status", "==", "active"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        } as Bible)
    );
  },

  getBook: async (bibleId, book) => {
    const bookDoc = await getDoc(bookRefByBibleBook(bibleId, book));
    return {
      ...bookDoc.data(),
      bibleBookId: `${bibleId}.${book}`,
    } as Book;
  },

  getChapter: async (bibleId, chapterId) => {
    const chapterDoc = await getDoc(chapterRefById(bibleId, chapterId));
    return {
      ...chapterDoc.data(),
      bibleChapterId: `${bibleId}.${chapterId}`,
    } as Chapter;
  },
};
