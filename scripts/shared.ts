import { initializeApp } from "firebase/app";
import { collection, getFirestore } from "firebase/firestore";

export const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
  measurementId: process.env.FIREBASE_MEASUREMENT_ID,
};

export const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export const genderMappings: Record<string, string> = {
  M: "Masculine",
  F: "Feminine",
  N: "Neuter",
  C: "Common",
};

export const partMappings: Record<string, string> = {
  N: "Noun",
  PRON: "Pronoun",
  V: "Verb",
  ADV: "Adverb",
  ADJ: "Adjective",
  PREP: "Preposition",
  CONJ: "Conjunction",
  VPAR: "Verb Participle",
  NUM: "Number",
};

export const [textusReceptus, vulgate, kjv, drc, hebrew] = [
  "3aefb10641485092-01",
  "ff5199704bbd50de-01",
  "de4e12af7f28f599-02",
  "5aefb10641485021-01",
  "0b262f1ed7f084a6-01",
];

export type WordTranslation = {
  word: string;
  translation: {
    part: string;
    gender: string;
    definitions: string[];
  };
  raw: string;
};

export type VerseTranslation = {
  verseId: string;
  wordTranslations: WordTranslation[];
};

export type ChapterTranslations = VerseTranslation[];

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

export const bibleCollection = collection(db, "bibles");
export const booksCollection = collection(db, "books");
export const chaptersCollection = collection(db, "chapters");
export const audioCollection = collection(db, "audio");
