import { collection, doc } from "firebase/firestore";
import { db } from "../config/firebase";

const bibleCollection = collection(db, "bibles");
const booksCollection = collection(db, "books");
const chaptersCollection = collection(db, "chapters");
const audioCollection = collection(db, "audio");

const chapterRefById = (bibleId: string, chapterId: string) =>
  doc(chaptersCollection, `${bibleId}.${chapterId}`);
const chapterRefByBibleBookAndChapter = (
  bibleId: string,
  book: string,
  chapter: number
) => chapterRefById(bibleId, `${book}.${chapter}`);

const bookRef = (bookId: string) => doc(booksCollection, bookId);
const bookRefByBibleBook = (bibleId: string, book: string) =>
  bookRef(`${bibleId}.${book}`);

const verseAudioRef = (bibleId: string, verseId: string) =>
  doc(audioCollection, `${bibleId}.${verseId}`);

export {
  bibleCollection,
  booksCollection,
  chaptersCollection,
  audioCollection,
  chapterRefById,
  chapterRefByBibleBookAndChapter,
  bookRef,
  bookRefByBibleBook,
  verseAudioRef,
};
