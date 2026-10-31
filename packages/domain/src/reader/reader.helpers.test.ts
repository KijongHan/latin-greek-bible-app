import { test } from "node:test";
import assert from "node:assert/strict";
import {
  adjacentChapter,
  buildPresets,
  defaultBiblePair,
  pickBiblePair,
  sharedBooks,
} from "./reader.helpers";
import type { Bible, Book } from "../types";

const bible = (id: string, abbreviation: string, books: string[]): Bible => ({
  id,
  abbreviation,
  books,
  name: id,
  language: "x",
});
const book = (id: string, chapters: number): Book => ({
  id,
  bibleId: "VLG",
  name: id,
  chapters: Array.from({ length: chapters }, (_, i) => `${id}.${i + 1}`),
  bookRecordKey: `VLG.${id}`,
});

const vlg = bible("vlg", "VLG", ["GEN", "EXO", "TOB"]);
const drc = bible("drc", "DRC", ["GEN", "EXO"]);
const kjv = bible("kjv", "KJV", ["GEN"]);
const books = ["GEN", "EXO"];

test("buildPresets resolves abbreviations to ids, with Custom last", () => {
  const presets = buildPresets([vlg, drc, kjv]);
  assert.deepEqual(presets[0], {
    name: "Vulgate - Douay Rheims",
    mainBibleId: "vlg",
    glossBibleId: "drc",
  });
  assert.equal(presets[2].mainBibleId, "kjv");
  assert.equal(
    presets[1].mainBibleId,
    "",
    "missing bibles resolve to empty ids",
  );
  assert.equal(presets.at(-1)?.name, "Custom");
});

test("defaultBiblePair picks the first preset, or else the first bible", () => {
  const pair = defaultBiblePair([kjv, vlg, drc]);
  assert.equal(pair.mainBible?.id, "vlg");
  assert.equal(pair.glossBible?.id, "drc");
  const fallback = defaultBiblePair([kjv]);
  assert.equal(fallback.mainBible?.id, "kjv");
  assert.equal(fallback.glossBible?.id, "kjv");
});

test("sharedBooks keeps the main bible's books the gloss also has", () => {
  assert.deepEqual(sharedBooks(vlg, drc), ["GEN", "EXO"]);
  assert.deepEqual(sharedBooks(vlg, undefined), []);
  assert.deepEqual(sharedBooks(undefined, drc), []);
});

test("pickBiblePair sets one side and keeps the other", () => {
  const pair = pickBiblePair([vlg, drc, kjv], "main", "kjv", {
    mainBible: vlg,
    glossBible: drc,
  });
  assert.equal(pair.mainBible?.id, "kjv");
  assert.equal(pair.glossBible?.id, "drc");
});

test("pickBiblePair moves the other side off the picked bible", () => {
  const main = pickBiblePair([vlg, drc, kjv], "main", "drc", {
    mainBible: vlg,
    glossBible: drc,
  });
  assert.equal(main.mainBible?.id, "drc");
  assert.equal(main.glossBible?.id, "vlg");

  const gloss = pickBiblePair([vlg, drc, kjv], "gloss", "vlg", {
    mainBible: vlg,
    glossBible: drc,
  });
  assert.equal(gloss.glossBible?.id, "vlg");
  assert.equal(gloss.mainBible?.id, "drc");
});

test("next chapter within a book", () => {
  assert.deepEqual(adjacentChapter(book("GEN", 50), 1, books, "next"), {
    type: "chapter",
    chapterId: "GEN.2",
  });
});

test("next chapter runs on into the next book", () => {
  assert.deepEqual(adjacentChapter(book("GEN", 50), 50, books, "next"), {
    type: "chapter",
    chapterId: "EXO.1",
  });
});

test("next chapter wraps from the last book to the first", () => {
  assert.deepEqual(adjacentChapter(book("EXO", 40), 40, books, "next"), {
    type: "chapter",
    chapterId: "GEN.1",
  });
});

test("previous chapter within a book", () => {
  assert.deepEqual(adjacentChapter(book("EXO", 40), 3, books, "previous"), {
    type: "chapter",
    chapterId: "EXO.2",
  });
});

test("previous chapter runs back to the previous book's last chapter", () => {
  assert.deepEqual(adjacentChapter(book("EXO", 40), 1, books, "previous"), {
    type: "lastChapterOf",
    bookId: "GEN",
  });
});

test("previous from the first book's first chapter goes home", () => {
  assert.deepEqual(adjacentChapter(book("GEN", 50), 1, books, "previous"), {
    type: "home",
  });
});
