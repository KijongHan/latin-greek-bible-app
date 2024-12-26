import * as fs from "node:fs/promises";

const genderMappings: Record<string, string> = {
  M: "Masculine",
  F: "Feminine",
  N: "Neuter",
  C: "Common",
};

const partMappings: Record<string, string> = {
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

  Object.entries(rawLookup).forEach(([word, raw], index: number) => {
    if (index > 500) return;
    const rawLines = raw.split(/(?<!\n)\n(?!\n)/);
    const translations = rawLines
      .find((line) => line.endsWith("\r") || line.endsWith("\n\n"))
      ?.split(";")
      ?.map((s) => s.trim());
    let tokens = rawLines[0].split(/[\s]+/);
    if (tokens[1] === "TACKON" || tokens[1] === "PREFIX") {
      tokens = rawLines[2].split(/[\s]+/);
    }
    const genderIndex = tokens.findIndex(
      (t, i) => i > 1 && genderMappings[t] !== undefined
    );
    const part = partMappings[tokens[1]];
    const gender =
      genderIndex !== -1 ? genderMappings[tokens[genderIndex]] : null;
  });
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
