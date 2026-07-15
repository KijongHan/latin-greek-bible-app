import { getDoc, getDocs, query, where } from "firebase/firestore";
import type { BibleQueries } from "@bible-app/domain";
import {
  bibleCollection,
  bookRefByBookId,
  chapterRefByChapterId,
  versesCollection,
} from "./firebase.repository";
import {
  toBible,
  toBook,
  toChapter,
  toVerse,
  type FirestoreBibleDoc,
  type FirestoreBookDoc,
  type FirestoreChapterDoc,
  type FirestoreVerseDoc,
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

  getVerses: async (bibleId, chapterId) => {
    const q = query(
      versesCollection,
      where("bibleId", "==", bibleId),
      where("chapterId", "==", chapterId),
    );
    const snapshot = await getDocs(q);
    return snapshot.docs
      .map((d) => toVerse(d.data() as FirestoreVerseDoc))
      .sort((a, b) => a.verseNumber - b.verseNumber);
  },
};
