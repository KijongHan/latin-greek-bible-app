import { getVerseId, type Token } from "@bible-app/domain";
import type { Tags } from "../shared/parser";

// A run of verse text; tagged runs are the \w spans, eg \w beginning|strong="H7225"\w*
export interface KjvSegment {
  text: string;
  strong?: string;
}

// eBible's KJV keeps the 1769 paragraph marks (¶), which the app's KJV doesn't show
const PILCROW = /¶\s*/g;
const FOOTNOTE = /\\f .*?\\f\*/g;
// Character styles whose text is kept: added words, divine name, words of Jesus, transliterations
const STYLE_MARKER = /\\\+?(?:add|nd|wj|tl)(?: |\*)/g;
const WORD = /\\\+?w ([^|\\]*)\|strong="([^"]*)"\\\+?w\*/g;
// Paragraph markers that continue the current verse onto a new line
const PARAGRAPH = /^\\(?:p|q\d?|b|m)\b\s*/;

function parseSegments(text: string): KjvSegment[] {
  const cleaned = text
    .replace(FOOTNOTE, "")
    .replace(STYLE_MARKER, "")
    .replace(PILCROW, "");
  const segments: KjvSegment[] = [];
  let last = 0;
  for (const match of cleaned.matchAll(WORD)) {
    if (match.index > last) segments.push({ text: cleaned.slice(last, match.index) });
    segments.push({ text: match[1], strong: match[2] });
    last = match.index + match[0].length;
  }
  if (last < cleaned.length) segments.push({ text: cleaned.slice(last) });
  return segments;
}

// One USFM book file. Psalm titles (\d) and headings (\s1, eg Psalm 119's ALEPH) aren't verse
// text in the KJV's numbering, so they're dropped.
export function parseUsfm(content: string): Map<string, KjvSegment[]> {
  const verses = new Map<string, KjvSegment[]>();
  let bookId = "";
  let chapter = 0;
  let current: string | undefined;
  const lines = new Map<string, string[]>();

  for (const raw of content.split(/\r?\n/)) {
    const line = raw.trim();
    const marker = line.match(/^\\(\w+)\s*(.*)$/);
    if (!marker) {
      if (current && line) lines.get(current)!.push(line);
      continue;
    }
    const [, tag, rest] = marker;
    if (tag === "id") bookId = rest.split(" ")[0];
    else if (tag === "c") chapter = Number(rest);
    else if (tag === "v") {
      const [, verse, text] = rest.match(/^(\d+)\s*(.*)$/)!;
      current = getVerseId(bookId, chapter, Number(verse));
      lines.set(current, [text]);
    } else if (PARAGRAPH.test(line)) {
      const text = line.replace(PARAGRAPH, "");
      if (current && text) lines.get(current)!.push(text);
    } else {
      current = undefined;
    }
  }

  for (const [verseId, parts] of lines) {
    verses.set(verseId, collapseWhitespace(parseSegments(parts.join(" "))));
  }
  return verses;
}

// Single spaces between words, none at the start or end of the verse
function collapseWhitespace(segments: KjvSegment[]): KjvSegment[] {
  const result: KjvSegment[] = [];
  for (const segment of segments) {
    let text = segment.text.replace(/\s+/g, " ");
    const previous = result[result.length - 1];
    if ((!previous || previous.text.endsWith(" ")) && text.startsWith(" ")) {
      text = text.slice(1);
    }
    if (text) result.push({ ...segment, text });
  }
  while (result.length > 0) {
    const last = result[result.length - 1];
    last.text = last.text.trimEnd();
    if (last.text) break;
    result.pop();
  }
  return result;
}

// Plain Strong's number of a dStrong: "G2264H" → "G2264", "H7225G" → "H7225"
function baseStrong(dStrong: string): string {
  return dStrong.match(/^[GH]\d+/)?.[0] ?? dStrong;
}

// TBESG / TBESH rows for KJV-era numbers that STEP folds into another entry, eg
// "G2076	G2076 = a Form of	G1510" (ἐστί → εἰμί) or "H3212	H3212 = a Spelling of	H1980I".
// Only same-language targets: "the Greek of" points Greek names at Hebrew ones.
export function parseStrongAliases(content: string): Map<string, string[]> {
  const aliases = new Map<string, string[]>();
  for (const line of content.split(/\r?\n/)) {
    const cols = line.split("\t");
    if (!/^[GH]\d+[A-Za-z]? = /.test(cols[1] ?? "")) continue;
    const strong = baseStrong(cols[0]);
    const targets = (cols[2]?.match(/[GH]\d+/g) ?? []).filter(
      (target) => target[0] === strong[0] && target !== strong,
    );
    if (targets.length === 0) continue;
    aliases.set(strong, [...new Set([...(aliases.get(strong) ?? []), ...targets])]);
  }
  return aliases;
}

// Each source word's parts (merged Greek words, Hebrew prefix/root/suffix) in verse order,
// by plain Strong's number and by the entries that number is an alias of
function indexParts(
  words: Tags[],
  aliases: Map<string, string[]>,
): { byStrong: Map<string, Tags[]>; byAlias: Map<string, Tags[]> } {
  const byStrong = new Map<string, Tags[]>();
  const byAlias = new Map<string, Tags[]>();
  const add = (index: Map<string, Tags[]>, key: string, part: Tags) => {
    if (!index.has(key)) index.set(key, []);
    index.get(key)!.push(part);
  };
  for (const word of words) {
    word.dStrongs.forEach((dStrong, i) => {
      const strong = baseStrong(dStrong);
      const part = { dStrongs: [dStrong], morphs: [word.morphs[i]] };
      add(byStrong, strong, part);
      for (const key of [strong, ...(aliases.get(strong) ?? [])]) add(byAlias, key, part);
    });
  }
  return { byStrong, byAlias };
}

// One token per word, with whitespace as its own token so joining token text reproduces the
// verse. A KJV word tagged with Strong's number S takes the dStrong and morph code of a source
// part in the same verse, tried in this order:
//   1. numbered S
//   2. numbered an alias of S, or sharing one (eg KJV μου G3450 and TAGNT G3165, both → G1473)
// The nth S in the KJV verse takes the nth match in the source, or the last one when the KJV
// repeats it more often (eg "grace for grace").
export function buildVerseTokens(
  segments: KjvSegment[],
  sourceWords: Tags[],
  aliases: Map<string, string[]>,
): { tokens: Token[]; unmatched: string[]; aliased: number } {
  const { byStrong, byAlias } = indexParts(sourceWords, aliases);
  const seen = new Map<string, number>();
  const tokens: Token[] = [];
  const unmatched: string[] = [];
  let aliased = 0;

  for (const segment of segments) {
    let tags: Tags | undefined;
    if (segment.strong) {
      const alias = byStrong.has(segment.strong)
        ? undefined
        : [segment.strong, ...(aliases.get(segment.strong) ?? [])].find((key) =>
            byAlias.has(key),
          );
      const candidates = alias ? byAlias.get(alias) : byStrong.get(segment.strong);
      if (candidates) {
        const key = alias ? `alias:${alias}` : segment.strong;
        const n = seen.get(key) ?? 0;
        seen.set(key, n + 1);
        tags = candidates[Math.min(n, candidates.length - 1)];
        if (alias) aliased++;
      } else {
        unmatched.push(segment.strong);
      }
    }
    for (const part of segment.text.split(/(\s+)/).filter(Boolean)) {
      const token: Token = { text: part };
      if (tags && /\S/.test(part)) {
        token.lexiconEntryIds = tags.dStrongs;
        token.morphCodeIds = tags.morphs;
      }
      tokens.push(token);
    }
  }
  return { tokens, unmatched, aliased };
}
