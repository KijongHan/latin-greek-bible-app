import { initializeApp } from "firebase/app";
import {
  collection,
  doc,
  getFirestore,
  setDoc,
  Bytes,
  getDocs,
} from "firebase/firestore";
import firebase from "firebase/compat/app";
import * as fs from "node:fs/promises";
import { Blob, Buffer } from "node:buffer";
import {
  audioCollection,
  ChapterTranslations,
  firebaseConfig,
  genderMappings,
  partMappings,
} from "./shared";

async function main() {
  // Get all files in audioClips directory
  const files = await fs.readdir("audioClips");

  for (const file of files) {
    if (!file.endsWith(".mp3")) continue;

    console.log(`Processing ${file}...`);

    // Read the audio file
    const audioData = await fs.readFile(`audioClips/${file}`);
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
}

async function test() {
  const audioDocs = await getDocs(audioCollection);
  const x: Uint8Array = audioDocs.docs.map((doc) =>
    doc.data().data.toUint8Array()
  )[0];
  const file = new Blob([x], { type: "audio/mp3" });
  const buffer = await file.arrayBuffer();
  await fs.writeFile("test.mp3", Buffer.from(buffer));
}

main();
//test();
