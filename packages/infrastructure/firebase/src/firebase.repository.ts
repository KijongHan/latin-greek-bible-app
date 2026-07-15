import { collection, doc } from "firebase/firestore";
import { db } from "./firebase.config";
import {
  getBookRecordKey,
  getChapterRecordKey,
  getVerseRecordKey,
} from "@bible-app/domain";

const bibleCollection = collection(db, "bibles");
const booksCollection = collection(db, "books");
const chaptersCollection = collection(db, "chapters");
const versesCollection = collection(db, "verses");
const audioCollection = collection(db, "audio");

const bibleRefById = (bibleId: string) => doc(bibleCollection, bibleId);

const chapterRefByKey = (key: string) => doc(chaptersCollection, key);
const chapterRefByChapterId = (bibleId: string, chapterId: string) =>
  chapterRefByKey(getChapterRecordKey(bibleId, chapterId));

const bookRefByKey = (key: string) => doc(booksCollection, key);
const bookRefByBookId = (bibleId: string, bookId: string) =>
  bookRefByKey(getBookRecordKey(bibleId, bookId));

const verseRefByKey = (key: string) => doc(versesCollection, key);
const verseRefByVerseId = (bibleId: string, verseId: string) =>
  verseRefByKey(getVerseRecordKey(bibleId, verseId));

const verseAudioRef = (bibleId: string, verseId: string) =>
  doc(audioCollection, `${bibleId}.${verseId}`);

export {
  bibleCollection,
  booksCollection,
  chaptersCollection,
  versesCollection,
  audioCollection,
  bibleRefById,
  chapterRefByKey,
  chapterRefByChapterId,
  bookRefByKey,
  bookRefByBookId,
  verseRefByKey,
  verseRefByVerseId,
  verseAudioRef,
};
