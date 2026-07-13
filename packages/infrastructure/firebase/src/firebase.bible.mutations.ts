import { BibleMutations } from "@bible-app/domain";
import {
  bibleRefById,
  bookRefByBookId,
  chapterRefByChapterId,
} from "./firebase.repository";
import { setDoc } from "firebase/firestore";
import { toFirestoreBook, toFirestoreChapter } from "./firebase.bible.dto";

export const firebaseBibleMutations: BibleMutations = {
  upsertBible: async (bible) => {
    await setDoc(bibleRefById(bible.id), bible);
  },

  upsertBook: async (book) => {
    const dto = toFirestoreBook(book);
    await setDoc(bookRefByBookId(book.bibleId, book.id), dto);
  },

  upsertChapter: async (chapter) => {
    const dto = toFirestoreChapter(chapter);
    await setDoc(chapterRefByChapterId(chapter.bibleId, chapter.id), dto);
  },
};
