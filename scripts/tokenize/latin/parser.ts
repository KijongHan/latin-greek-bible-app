import type { Token } from "@bible-app/domain";
import type {
  LatinEntryType,
  LatinLexiconEntry,
  PartOfSpeech,
} from "../../lexicons/shared/types";
import type { NameMatcher } from "./names";

// One word from lemmatize.py: [text, lemma, upos, feats]
export type LemmaToken = [string, string, string, string];

// Spelling that LatinCy's output, the Clementine text and L&S all reduce to:
// lowercase letters, no quantity marks, æ/œ spelled out, j → i, v → u.
// LatinCy writes `Iacob` and `uerbum`, the Clementine `Jacob` and `Verbum`.
export function normalizeLatin(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/æ/g, "ae")
    .replace(/œ/g, "oe")
    .replace(/j/g, "i")
    .replace(/v/g, "u")
    .replace(/[^\p{L}]/gu, "");
}

// UD part of speech -> L&S parts of speech it can match
const POS_MATCHES: Record<string, (pos: PartOfSpeech) => boolean> = {
  NOUN: (pos) => pos === "noun",
  PROPN: (pos) => pos === "noun",
  VERB: (pos) => pos === "verb",
  AUX: (pos) => pos === "verb",
  ADJ: (pos) => pos === "adjective",
  NUM: (pos) => pos === "adjective",
  ADV: (pos) => pos === "adverb",
  ADP: (pos) => pos === "preposition",
  CCONJ: (pos) => pos === "conjunction",
  SCONJ: (pos) => pos === "conjunction",
  PRON: (pos) => pos.startsWith("pronoun"),
  DET: (pos) => pos.startsWith("pronoun") || pos === "adjective",
  INTJ: (pos) => pos === "interjection",
  PART: (pos) => ["adverb", "conjunction", "particle"].includes(pos),
};

// Ordinary words first; glossary-only and spurious entries last
const ENTRY_TYPE_RANK: Record<LatinEntryType, number> = {
  main: 0,
  greek: 0,
  foreign: 1,
  hapax: 1,
  gloss: 2,
  spur: 3,
};

interface Candidate {
  entry: LatinLexiconEntry;
  // true when the lemma matched an alternative form, not the headword
  alternative: boolean;
}

export type LemmaResolver = (lemma: string, upos: string) => string | undefined;

// Picks the L&S entry for a lemma. Homographs are ranked by:
// 1. matched on the headword rather than an alternative form
// 2. entry type (main / greek before hapax, gloss, spur)
// 3. part of speech agreeing with LatinCy's
// 4. more senses, since the common word has the longer entry
//    (dico2 "say", 33 senses, over dico1 "dedicate")
export function buildLemmaResolver(entries: LatinLexiconEntry[]): LemmaResolver {
  const candidates = new Map<string, Candidate[]>();
  for (const entry of entries) {
    entry.lemma.split(", ").forEach((form, i) => {
      const key = normalizeLatin(form);
      if (!candidates.has(key)) candidates.set(key, []);
      candidates.get(key)!.push({ entry, alternative: i > 0 });
    });
  }

  return (lemma, upos) => {
    const matches = candidates.get(normalizeLatin(lemma));
    if (!matches) return undefined;
    const posMatches = POS_MATCHES[upos] ?? (() => false);
    const rank = ({ entry, alternative }: Candidate) => [
      alternative ? 1 : 0,
      ENTRY_TYPE_RANK[entry.entryType],
      entry.morph.partOfSpeech && posMatches(entry.morph.partOfSpeech) ? 0 : 1,
      -entry.senses.length,
    ];
    const [best] = [...matches].sort((a, b) => {
      const [ra, rb] = [rank(a), rank(b)];
      const i = ra.findIndex((v, j) => v !== rb[j]);
      return i === -1 ? 0 : ra[i] - rb[i];
    });
    return best.entry.id;
  };
}

// Resolves one lemmatized word of a verse to a lexicon id
export type WordResolver = (lemma: string, upos: string, form: string) => string | undefined;

// Names get TIPNR dStrongs, so they link to their Greek / Hebrew lexicon
// entry; other words get L&S ids. A name spelled exactly like a TIPNR name
// beats L&S (Israel → H3478 rather than L&S Israel), but a near spelling only
// counts after L&S has no entry, so Dominus doesn't become Edomite.
export function buildWordResolver(
  lexicon: LemmaResolver,
  names: NameMatcher,
): (verseId: string) => WordResolver {
  return (verseId) => (lemma, upos, form) => {
    const forms = [lemma, form];
    const exactName = () => names.exact(verseId, forms);
    return (
      (upos === "PROPN" ? exactName() : undefined) ??
      lexicon(lemma, upos) ??
      exactName() ??
      names.fuzzy(verseId, forms, /^\p{Lu}/u.test(form))
    );
  };
}

// Splits a verse on whitespace, like the Greek and Hebrew tokenizers, and
// tags each word with the lemmatized parts it spells. LatinCy splits
// enclitics, so Dixitque gets two parts: dico + que.
//
// Parts are matched to words by letters, since LatinCy respells words
// (cælum → caelum) and so its character offsets don't match the source text.
// Returns undefined when the letters don't line up.
export function buildVerseTokens(
  text: string,
  lemmaTokens: LemmaToken[],
  resolve: WordResolver,
): Token[] | undefined {
  const parts = text.split(/(\s+)/).filter(Boolean);
  const tokens: Token[] = parts.map((part) => ({ text: part }));

  let next = 0;
  let pending = "";
  for (const token of tokens) {
    let letters = normalizeLatin(token.text);
    if (!letters) continue;

    const lexiconEntryIds: string[] = [];
    const morphCodeIds: string[] = [];
    while (letters) {
      if (!pending) {
        const lemmaToken = lemmaTokens[next++];
        if (!lemmaToken) return undefined;
        const [partText, lemma, upos, feats] = lemmaToken;
        pending = normalizeLatin(partText);
        const id = resolve(lemma, upos, partText);
        if (id) {
          lexiconEntryIds.push(id);
          morphCodeIds.push(feats ? `${upos}|${feats}` : upos);
        }
      }
      // A part may run across words, or a word hold several parts
      const shared = Math.min(letters.length, pending.length);
      if (letters.slice(0, shared) !== pending.slice(0, shared)) return undefined;
      letters = letters.slice(shared);
      pending = pending.slice(shared);
    }

    if (lexiconEntryIds.length > 0) {
      token.lexiconEntryIds = lexiconEntryIds;
      token.morphCodeIds = morphCodeIds;
    }
  }
  return next === lemmaTokens.length && !pending ? tokens : undefined;
}
