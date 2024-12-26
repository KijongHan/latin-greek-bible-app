import { getDoc, getDocs, query, where } from "firebase/firestore";
import {
  bibleCollection,
  bookRefByBibleBook,
  chapterRefByBibleBookAndChapter,
  chapterRefById,
} from "@/lib/repositories/firebase.repository";
import { Bible, Book, Chapter } from "./bible.model";

export const getAncientBibles = async (): Promise<Bible[]> => {
  const q = query(bibleCollection, where("language.name", "==", "Latin"));
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
  const bookRef = bookRefByBibleBook(bibleId, book);
  const bookDoc = await getDoc(bookRef);
  return bookDoc.data() as Book;
};

export const getChapter = async (
  bibleId: string,
  chapterId: string
): Promise<Chapter> => {
  const chapterRef = chapterRefById(bibleId, chapterId);
  const chapterDoc = await getDoc(chapterRef);
  return chapterDoc.data() as Chapter;
};
