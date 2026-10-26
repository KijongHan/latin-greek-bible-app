import { bookIds, getVerseId, type Token } from "@bible-app/domain";
import {
  tokenizeVerse,
  wordsForEdition,
  type Tags,
  type TaggedVerseWord,
} from "../shared/parser";

export interface TargetWord {
  id: string;
  text: string;
  skipSpaceAfter: boolean;
  exclude: boolean;
}

export interface SourceWord {
  id: string;
  text: string;
}

interface TsvRow {
  [column: string]: string;
}

function parseTsv(content: string): TsvRow[] {
  const [header, ...lines] = content.split(/\r?\n/).filter(Boolean);
  const columns = header.split("\t");
  return lines.map((line) => {
    const cells = line.split("\t");
    return Object.fromEntries(columns.map((c, i) => [c, cells[i] ?? ""]));
  });
}

// Clear ids start with BBCCCVVV (book 1-66 in canonical order), eg "40001001001" or "n40001001001"
function verseIdOf(id: string): string {
  const digits = id.replace(/^[a-z]/, "");
  return getVerseId(
    bookIds[Number(digits.slice(0, 2)) - 1],
    Number(digits.slice(2, 5)),
    Number(digits.slice(5, 8)),
  );
}

// nt_BSB.tsv / ot_BSB.tsv
export function parseTargets(content: string): Map<string, TargetWord[]> {
  const verses = new Map<string, TargetWord[]>();
  for (const row of parseTsv(content)) {
    const verseId = verseIdOf(row.id);
    if (!verses.has(verseId)) verses.set(verseId, []);
    verses.get(verseId)!.push({
      id: row.id,
      text: row.text,
      skipSpaceAfter: row.skip_space_after === "y",
      exclude: row.exclude === "y",
    });
  }
  return verses;
}

// SBLGNT.tsv / WLCM.tsv
export function parseSources(content: string): Map<string, SourceWord[]> {
  const verses = new Map<string, SourceWord[]>();
  for (const row of parseTsv(content)) {
    const verseId = verseIdOf(row.id);
    if (!verses.has(verseId)) verses.set(verseId, []);
    verses.get(verseId)!.push({ id: row.id, text: row.text });
  }
  return verses;
}

// Scripture Burrito alignment: { records: [{ source: [ids], target: [ids] }] }
export function parseAlignment(content: string): Map<string, string[]> {
  const records: { source: string[]; target: string[] }[] =
    JSON.parse(content).records;
  const sourcesByTarget = new Map<string, string[]>();
  for (const { source, target } of records) {
    for (const targetId of target) {
      const sources = sourcesByTarget.get(targetId) ?? [];
      for (const id of source) if (!sources.includes(id)) sources.push(id);
      sourcesByTarget.set(targetId, sources);
    }
  }
  return sourcesByTarget;
}

export interface TahotWord extends Tags {
  root: number;
}

// "Gen.1.1#01=L" or "Gen.31.55(32.1)#01=L" — English ref first, Hebrew ref in brackets
const TAHOT_REF = /^(\w{3})\.(\d+)\.(\d+)(?:\((\d+)\.(\d+)\))?#(\d+)=(\S+)/;

// Keyed by Hebrew verse and word number, which is how WLC numbers its words.
// dStrongs "H9003/{H7225G}\H9016": "/" splits prefix/root/suffix, {} marks the root,
// "\" starts punctuation. Grammar "HR/Ncfsa" gives the language letter once.
export function parseTahot(content: string): Map<string, TahotWord> {
  const words = new Map<string, TahotWord>();
  for (const line of content.split(/\r?\n/)) {
    const match = line.match(TAHOT_REF);
    if (!match) continue;
    const [, book, chapter, verse, hebChapter, hebVerse, word, type] = match;
    // K = Ketiv shown as a variant of the Qere; X = words reconstructed from the LXX
    if (type.startsWith("K") || type.startsWith("X")) continue;

    const cols = line.split("\t");
    const parts = cols[4].split("\\")[0].split("/").filter((p) => p.trim());
    if (parts.length === 0) continue;
    const morphs = (cols[5] ?? "").split("\\")[0].split("/");
    const language = morphs[0]?.[0] ?? "H";
    const root = parts.findIndex((p) => p.includes("{"));

    const verseId = getVerseId(
      book.toUpperCase(),
      Number(hebChapter ?? chapter),
      Number(hebVerse ?? verse),
    );
    words.set(`${verseId}#${Number(word)}`, {
      dStrongs: parts.map((p) => p.replace(/[{}+\s]/g, "")),
      // Later parts never repeat the language letter, eg Aramaic "ANcmpd/Ta" → "ANcmpd", "ATa"
      morphs: parts.map((_, i) => {
        const morph = morphs[i]?.trim() ?? "";
        return i === 0 ? morph : `${language}${morph}`;
      }),
      root: root === -1 ? parts.length - 1 : root,
    });
  }
  return words;
}

// SBLGNT words get dStrongs and morph codes from TAGNT's SBL edition
export function greekTagsBySourceId(
  sources: Map<string, SourceWord[]>,
  tagnt: Map<string, TaggedVerseWord[]>,
): Map<string, Tags> {
  const tags = new Map<string, Tags>();
  for (const [verseId, words] of sources) {
    const tokens = tokenizeVerse(
      words.map((w) => w.text).join(" "),
      wordsForEdition(tagnt.get(verseId) ?? [], "SBL"),
    ).filter((t) => /\S/.test(t.text));
    tokens.forEach((token, i) => {
      if (token.lexiconEntryIds && token.morphCodeIds) {
        tags.set(words[i].id, {
          dStrongs: token.lexiconEntryIds,
          morphs: token.morphCodeIds,
        });
      }
    });
  }
  return tags;
}

// WLCM ids end in WWWP: word number, then part number within the word.
// Parts pair with TAHOT's by position; when the counts differ, every part gets TAHOT's root.
export function hebrewTagsBySourceId(
  sources: Map<string, SourceWord[]>,
  tahot: Map<string, TahotWord>,
): { tags: Map<string, Tags>; rootOnlyWords: number } {
  const tags = new Map<string, Tags>();
  let rootOnlyWords = 0;
  for (const [verseId, parts] of sources) {
    const byWord = new Map<number, SourceWord[]>();
    for (const part of parts) {
      const word = Number(part.id.slice(-4, -1));
      if (!byWord.has(word)) byWord.set(word, []);
      byWord.get(word)!.push(part);
    }
    for (const [word, wordParts] of byWord) {
      const tahotWord = tahot.get(`${verseId}#${word}`);
      if (!tahotWord) continue;
      const samePartCount = tahotWord.dStrongs.length === wordParts.length;
      if (!samePartCount) rootOnlyWords++;
      wordParts.forEach((part, i) => {
        const at = samePartCount ? i : tahotWord.root;
        tags.set(part.id, {
          dStrongs: [tahotWord.dStrongs[at]],
          morphs: [tahotWord.morphs[at]],
        });
      });
    }
  }
  return { tags, rootOnlyWords };
}

// One token per BSB word, with whitespace as its own token so joining token text
// reproduces the verse. Words carry the tags of every source word aligned to them.
export function buildVerseTokens(
  words: TargetWord[],
  sourcesByTarget: Map<string, string[]>,
  tagsBySourceId: Map<string, Tags>,
): Token[] {
  const tokens: Token[] = [];
  words.forEach((word, i) => {
    const token: Token = { text: word.text };
    if (!word.exclude) {
      const pairs = new Map<string, [string, string]>();
      for (const sourceId of sourcesByTarget.get(word.id) ?? []) {
        const tags = tagsBySourceId.get(sourceId);
        tags?.dStrongs.forEach((dStrong, j) => {
          pairs.set(`${dStrong}|${tags.morphs[j]}`, [dStrong, tags.morphs[j]]);
        });
      }
      if (pairs.size > 0) {
        token.lexiconEntryIds = [...pairs.values()].map(([dStrong]) => dStrong);
        token.morphCodeIds = [...pairs.values()].map(([, morph]) => morph);
      }
    }
    tokens.push(token);
    if (!word.skipSpaceAfter && i < words.length - 1) tokens.push({ text: " " });
  });
  return tokens;
}
