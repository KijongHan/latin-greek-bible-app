import { BibleMutations } from "@bible-app/domain";
import {
  bibleRefById,
  bookRefByBookId,
  chapterRefByChapterId,
  verseRefByVerseId,
} from "./firebase.repository";
import { setDoc, writeBatch, type DocumentReference } from "firebase/firestore";
import { db } from "./firebase.config";
import {
  toFirestoreBook,
  toFirestoreChapter,
  toFirestoreVerse,
} from "./firebase.bible.dto";

const FIRESTORE_BATCH_LIMIT = 500;

const commitInBatches = async <T>(
  items: T[],
  toRef: (item: T) => DocumentReference,
  toData: (item: T) => Record<string, unknown>,
) => {
  const total = items.length;
  if (total === 0) return;
  for (let i = 0; i < total; i += FIRESTORE_BATCH_LIMIT) {
    const batch = writeBatch(db);
    const chunk = items.slice(i, i + FIRESTORE_BATCH_LIMIT);
    for (const item of chunk) {
      batch.set(toRef(item), toData(item));
    }
    await batch.commit();
  }
};

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

  upsertChapters: async (chapters) => {
    await commitInBatches(
      chapters,
      (c) => chapterRefByChapterId(c.bibleId, c.id),
      (c) => toFirestoreChapter(c) as unknown as Record<string, unknown>,
    );
  },

  upsertVerse: async (verse) => {
    const dto = toFirestoreVerse(verse);
    await setDoc(verseRefByVerseId(verse.bibleId, verse.id), dto);
  },

  upsertVerses: async (verses) => {
    await commitInBatches(
      verses,
      (v) => verseRefByVerseId(v.bibleId, v.id),
      (v) => toFirestoreVerse(v) as unknown as Record<string, unknown>,
    );
  },
};
