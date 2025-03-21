import fs from "node:fs/promises";
import path from "node:path";
import OpenAI from "openai";
import { Buffer } from "node:buffer";
import { Bytes, getDoc, setDoc } from "firebase/firestore";
import { doc } from "firebase/firestore";
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { collection } from "firebase/firestore";
import {
  audioCollection,
  bibleCollection,
  booksCollection,
  chaptersCollection,
  ChapterTranslations,
  drc,
  firebaseConfig,
  genderMappings,
  hebrew,
  kjv,
  OPENAI_API_KEY,
  partMappings,
} from "./shared";

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

async function generateAudio(fileName: string, text: string, bibleId: string) {
  const mp3 = await openai.audio.speech.create({
    model: "tts-1",
    voice: bibleId === kjv || bibleId === drc ? "nova" : "alloy",
    input: text,
    speed: 0.9,
  });

  const buffer = Buffer.from(await mp3.arrayBuffer());
  await fs.writeFile(`audioClips/${fileName}.mp3`, buffer);
}

async function uploadAudio(file: string) {
  // Read the audio file
  const audioData = await fs.readFile(`audioClips/${file}.mp3`);
  const audioArray = new Uint8Array(audioData.buffer);
  const audioBlob = Bytes.fromUint8Array(audioArray);

  // TODO: Upload audio file to storage
  // The file name format is: {bibleId}-{verseId}.mp3
  const [bible, bibleVersion, verseId] = file.replace(".mp3", "").split("-");
  const bibleId = `${bible}-${bibleVersion}`;

  console.log(`${bibleId} - ${verseId}`);
  const [book, chapterNumber, verseNumber] = verseId.split(".");
  const chapterId = `${book}.${chapterNumber}`;

  const audioDoc = doc(audioCollection, `${bibleId}.${verseId}`);
  await setDoc(audioDoc, {
    data: audioBlob,
    verseId: verseId,
    chapterId: chapterId,
    bibleId: bibleId,
    chapterNumber: chapterNumber,
    verseNumber: verseNumber,
    createdAt: new Date(),
  });
}

async function main(bibleId: string) {
  console.log("Getting bible...");
  const bibleRef = doc(bibleCollection, bibleId);
  const bible = await getDoc(bibleRef);
  const bibleData = bible.data();
  if (!bibleData) {
    console.error("Bible not found");
    return;
  }
  console.log("Bible found");
  console.log(bibleData);

  for (const b of bibleData.books) {
    if (b !== "GEN") continue;
    const bookRef = doc(booksCollection, `${bibleId}.${b}`);
    const book = await getDoc(bookRef);
    const bookData = book.data();
    if (!bookData) {
      console.error("Book not found");
      return;
    }

    const chapters = bookData.chapters;
    let skip = true;
    for (const c of chapters) {
      if (c === "GEN.44") {
        skip = false;
      }
      if (skip) continue;
      console.log(c);
      const chapterRef = doc(chaptersCollection, `${bibleId}.${c}`);
      const chapter = await getDoc(chapterRef);
      const chapterData = chapter.data();
      if (!chapterData) {
        console.error("Chapter not found");
        continue;
      }

      console.log(chapterData);
      for (const v of chapterData.verses) {
        const fileName = `${bibleId}-${v.verseId ?? v.id}`;
        await generateAudio(fileName, `${v.text}`, bibleId);
        await uploadAudio(fileName);
      }
    }
  }
}

main(hebrew);
