import { collection } from "firebase/firestore";
import { db } from "../config/firebase";

const bibleCollection = collection(db, "bibles");
const booksCollection = collection(db, "books");
const chaptersCollection = collection(db, "chapters");

export { bibleCollection, booksCollection, chaptersCollection };
