import { getDoc, getDocs, query, where } from "firebase/firestore";
import type { BibleQueries } from "@bible-app/domain";
import {
  bibleCollection,
  bookRefByBookId,
  chapterRefByChapterId,
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
    const q = query(bibleCollection);
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) =>
      toBible(doc.id, doc.data() as FirestoreBibleDoc),
    );
  },

  getBook: async (bibleId, bookId) => {
    const bookDoc = await getDoc(bookRefByBookId(bibleId, bookId));
    return toBook(bookDoc.data() as FirestoreBookDoc);
  },

  getChapter: async (bibleId, chapterId) => {
    const chapterDoc = await getDoc(chapterRefByChapterId(bibleId, chapterId));
    return toChapter(chapterDoc.data() as FirestoreChapterDoc);
  },
};
