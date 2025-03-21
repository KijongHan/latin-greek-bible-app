import * as fs from "node:fs/promises";
import {
  ChapterTranslations,
  firebaseConfig,
  genderMappings,
  partMappings,
} from "./shared";

async function fixLatinTranslations() {
  const rawChapterTranslationsMap: ChapterTranslations = JSON.parse(
    await fs.readFile(
      "C:\\Users\\thoma\\Software\\Bible\\data\\translations\\ff5199704bbd50de-01.GEN.1.json",
      "utf8"
    )
  );
  console.log(rawChapterTranslationsMap);
}

async function generateWordTranslations() {
  const rawLookup: Record<string, string> = JSON.parse(
    await fs.readFile(
      `C:\\Users\\thoma\\Software\\Bible\\data\\wordOccurrences\\latin-word-raw-lookup.archive.json`,
      "utf8"
    )
  );

  let unknownWords = {};
  const wordTranslations = Object.entries(rawLookup).map(([word, raw]) => {
    const rawLines = raw.split(/(?<!\n)\n(?!\n)/);
    let translations = rawLines
      .find((line) => line.endsWith("\r") || line.endsWith("\n\n"))
      ?.split(";")
      ?.map((s) => s.trim());
    let tokens = rawLines[0].split(/[\s]+/);
    if (tokens[1] === "TACKON" || tokens[1] === "PREFIX") {
      tokens = rawLines[2].split(/[\s]+/);
    }

    if (tokens.some((t) => t === "UNKNOWN")) {
      unknownWords = { ...unknownWords, [word]: true };
      return;
    }

    const genderIndex = tokens.findIndex(
      (t, i) => i > 1 && genderMappings[t] !== undefined
    );
    const part = partMappings[tokens[1]];
    if (part === "Number" && translations) {
      translations[0] = translations[0]?.replace(" - (ORD, 'in series')", "");
      translations[0] = translations[0]?.replace(
        " - (CARD answers 'how many')",
        ""
      );
    }
    translations = translations?.filter((t) => t !== "");
    translations = translations?.map((t) => t.replace("_", " "));
    translations = translations
      ?.map((t) => t.split(","))
      .flat()
      .map((t) => t.trim())
      .filter((t) => !t.includes("DEMONST"));
    const gender =
      genderIndex !== -1 ? genderMappings[tokens[genderIndex]] : null;
    return {
      [word]: {
        part,
        gender,
        definitions: translations,
      },
    };
  });
  await fs.writeFile(
    `C:\\Users\\thoma\\Software\\Bible\\data\\wordOccurrences\\latin-word-translations.json`,
    JSON.stringify(wordTranslations, null, 2)
  );
  await fs.writeFile(
    `C:\\Users\\thoma\\Software\\Bible\\data\\wordOccurrences\\latin-unknown-words.json`,
    JSON.stringify(unknownWords, null, 2)
  );
}

async function generateLatinWordRawLookup() {
  const chapterIds = ["GEN.1", "GEN.2"];
  for (const chapterId of chapterIds) {
    const chapter: ChapterTranslations = JSON.parse(
      await fs.readFile(
        `C:\\Users\\thoma\\Software\\Bible\\data\\translations\\ff5199704bbd50de-01.${chapterId}.json`,
        "utf8"
      )
    );

    const rawLookup = new Map<string, string>();
    for (const verse of chapter) {
      for (const word of verse.wordTranslations) {
        rawLookup.set(word.word, word.raw);
      }
    }
    await fs.writeFile(
      `C:\\Users\\thoma\\Software\\Bible\\data\\wordOccurrences\\latin-word-raw-lookup.json`,
      JSON.stringify(Object.fromEntries(rawLookup), null, 2)
    );
  }
}

async function generateLatinWordLookup() {
  const dictionary = new Map<string, number>();
  const verseOccurrencesDictionary = new Map<string, string[]>();
  const chapterOccurrencesDictionary = new Map<
    string,
    { chapterId: string; occurences: number }[]
  >();

  const chapterIds = ["GEN.1", "GEN.2"];
  for (const chapterId of chapterIds) {
    const chapter: ChapterTranslations = JSON.parse(
      await fs.readFile(
        `C:\\Users\\thoma\\Software\\Bible\\data\\translations\\ff5199704bbd50de-01.${chapterId}.json`,
        "utf8"
      )
    );
    for (const verse of chapter) {
      for (const word of verse.wordTranslations) {
        const count = dictionary.get(word.word) || 0;
        dictionary.set(word.word, count + 1);
        const existingVerses = verseOccurrencesDictionary.get(word.word) || [];
        verseOccurrencesDictionary.set(word.word, [
          ...existingVerses,
          verse.verseId,
        ]);
        const existingChapters =
          chapterOccurrencesDictionary.get(word.word) || [];
        const existingChapter = existingChapters.find(
          (c) => c.chapterId === "GEN.1"
        );
        if (existingChapter) {
          existingChapter.occurences++;
        } else {
          existingChapters.push({ chapterId: "GEN.1", occurences: 1 });
        }
        chapterOccurrencesDictionary.set(word.word, existingChapters);
      }
    }
    console.log(chapterOccurrencesDictionary);
    console.log(verseOccurrencesDictionary);
    console.log(dictionary);

    await fs.writeFile(
      `C:\\Users\\thoma\\Software\\Bible\\data\\wordOccurrences\\latin-word-lookup.json`,
      JSON.stringify(Object.fromEntries(dictionary), null, 2)
    );
  }
}

// fixLatinTranslations();
// generateLatinWordLookup();
// generateLatinWordRawLookup();
generateWordTranslations();
