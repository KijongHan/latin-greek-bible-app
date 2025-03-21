import { initializeApp } from "firebase/app";
import { collection, doc, getDoc, getFirestore } from "firebase/firestore";
import * as fs from "node:fs/promises";
import { setTimeout } from "node:timers/promises";
import AWS from "aws-sdk";
import { Stream } from "node:stream";
import {
  bibleCollection,
  booksCollection,
  chaptersCollection,
  ChapterTranslations,
  firebaseConfig,
  genderMappings,
  partMappings,
} from "./shared";

async function main() {
  AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    sessionToken: process.env.AWS_SESSION_TOKEN,
    region: process.env.AWS_REGION,
  });
  const polly = new AWS.Polly();

  async function generateAudio(fileName: string, text: string) {
    const params: AWS.Polly.SynthesizeSpeechInput = {
      Engine: "neural",
      //LanguageCode: "it-IT",
      LanguageCode: "en-US",
      OutputFormat: "mp3",
      Text: text,
      TextType: "text",
      VoiceId: "Matthew",
    };

    return await new Promise((resolve, reject) => {
      polly.synthesizeSpeech(params, async (err, data) => {
        if (err) {
          console.error("Error:", err);
          reject(err);
          return;
        }
        console.log(data.AudioStream);
        const stream = data.AudioStream as Stream;
        if (stream) {
          await fs.writeFile(`outputs/${fileName}.mp3`, stream);
        }
        resolve(null);
      });
    });
  }

  console.log("Getting bible...");
  const bibleId = "de4e12af7f28f599-02";
  const bibleRef = doc(bibleCollection, bibleId);
  const bible = await getDoc(bibleRef);
  const bibleData = bible.data();
  if (!bibleData) {
    console.error("Bible not found");
    return;
  }
  console.log("Bible found");
  console.log(bibleData);

  let skip = true;
  for (const b of bibleData.books) {
    const bookRef = doc(booksCollection, `${bibleId}.${b}`);
    const book = await getDoc(bookRef);
    const bookData = book.data();
    if (!bookData) {
      console.error("Book not found");
      return;
    }

    const chapters = bookData.chapters;
    for (const c of chapters) {
      const chapterRef = doc(chaptersCollection, `${bibleId}.${c}`);
      const chapter = await getDoc(chapterRef);
      const chapterData = chapter.data();
      if (!chapterData) {
        console.error("Chapter not found");
        return;
      }

      console.log(chapterData);
      for (const v of chapterData.verses) {
        await generateAudio(`${bibleId}-${v.verseId ?? v.id}`, `${v.text}`);
      }
    }
    break;
  }
}

main();
