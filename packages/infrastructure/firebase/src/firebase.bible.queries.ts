import { getDoc, getDocs, query, where } from "firebase/firestore";
import type { BibleQueries } from "@bible-app/domain";
import {
  bibleCollection,
  bookRefByBibleBook,
  chapterRefById,
} from "./firebase.repository";
import {
  toBible,
  toBook,
  toChapter,
  type FirestoreBibleDoc,
  type FirestoreBookDoc,
  type FirestoreChapterDoc,
} from "./firebase.bible.dto";

export const firebaseBibleQueries: BibleQueries = {
  getBibles: async () => {
    const q = query(bibleCollection, where("status", "==", "active"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) =>
      toBible(doc.id, doc.data() as FirestoreBibleDoc)
    );
  },

  getBook: async (bibleId, book) => {
    const bookDoc = await getDoc(bookRefByBibleBook(bibleId, book));
    return toBook(bibleId, book, bookDoc.data() as FirestoreBookDoc);
  },

  getChapter: async (bibleId, chapterId) => {
    const chapterDoc = await getDoc(chapterRefById(bibleId, chapterId));
    return toChapter(
      bibleId,
      chapterId,
      chapterDoc.data() as FirestoreChapterDoc
    );
  },
};
