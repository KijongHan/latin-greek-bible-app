import { getVerseId, type Token } from "@bible-app/domain";

export interface TaggedWord {
  forms: Set<string>;
  dStrong: string;
}

export interface TaggedVerseWord {
  form: string;
  spellings: string[];
  dStrong: string;
  editions: string[];
  variants: { forms: string[]; dStrong: string; editions: string[] }[];
}

// eg "Mat.1.1#01=NKO" or "Gen.31.55(32.1)#01=L" — English ref first, Hebrew ref in brackets
const WORD_REF = /^(\w{3})\.(\d+)\.(\d+)(?:\([^)]*\))?#\d+=/;

// Accents, case, final sigma and punctuation all differ between editions
export function normalizeGreek(word: string): string {
  return word
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/ς/g, "σ")
    .replace(/[^\p{L}]/gu, "");
}

// "NA28+TR«3+Byz«3" — «n / »n mark the word as moved in that edition
function parseEditions(field: string): string[] {
  return field
    .trim()
    .split("+")
    .map((edition) => edition.replace(/[«»*].*$/, ""));
}

// "γέννησις (t=gennēsis) birth - G1083=N-NSF in: TR+Byz ¦ …"
function parseMeaningVariants(field: string): TaggedVerseWord["variants"] {
  if (!field) return [];
  return field.split("¦").flatMap((variant) => {
    const split = variant.lastIndexOf(" - ");
    if (split === -1) return [];
    const [greek] = variant.slice(0, split).split(" (");
    const match = variant.slice(split + 3).match(/^(G\d+[A-Za-z]?)=\S* in: (.+)$/);
    if (!match) return [];
    return [
      {
        forms: greek.trim().split(/\s+/).map(normalizeGreek).filter(Boolean),
        dStrong: match[1],
        editions: parseEditions(match[2]),
      },
    ];
  });
}

// "TR: ἀνελήφθη ; WH: Ἰωάνης ; "
function parseSpellingVariants(field: string): string[] {
  if (!field) return [];
  return field
    .split(";")
    .map((variant) => normalizeGreek(variant.split(":").slice(1).join(":")))
    .filter(Boolean);
}

export function parseTagnt(content: string): Map<string, TaggedVerseWord[]> {
  const verses = new Map<string, TaggedVerseWord[]>();
  for (const line of content.split(/\r?\n/)) {
    const match = line.match(WORD_REF);
    if (!match) continue;
    const [, book, chapter, verse] = match;
    const cols = line.split("\t");
    const verseId = getVerseId(book.toUpperCase(), Number(chapter), Number(verse));

    const [greek] = cols[1].split(" (");
    const word: TaggedVerseWord = {
      form: normalizeGreek(greek),
      spellings: parseSpellingVariants(cols[7]),
      dStrong: cols[3].split("=")[0].trim(),
      editions: parseEditions(cols[5]),
      variants: parseMeaningVariants(cols[6]),
    };

    if (!verses.has(verseId)) verses.set(verseId, []);
    verses.get(verseId)!.push(word);
  }
  return verses;
}

// The words of one edition, in TAGNT order. A word missing from the edition
// is replaced by that edition's meaning variant, if it has one.
export function wordsForEdition(
  words: TaggedVerseWord[],
  edition: string,
): TaggedWord[] {
  return words.flatMap((word) => {
    if (word.editions.includes(edition)) {
      return [
        {
          forms: new Set([word.form, ...word.spellings]),
          dStrong: word.dStrong,
        },
      ];
    }
    const variant = word.variants.find((v) => v.editions.includes(edition));
    if (!variant) return [];
    return variant.forms.map((form) => ({
      forms: new Set([form]),
      dStrong: variant.dStrong,
    }));
  });
}

// Longest common subsequence on normalized forms, then:
// - unmatched words are paired with any unused tagged word of the same form (word order differs)
// - a single unmatched word whose neighbours pair with adjacent tagged words takes the
//   tagged word between them (a spelling difference)
function align(words: string[], tagged: TaggedWord[]): Map<number, number> {
  const n = words.length;
  const m = tagged.length;
  const lcs = Array.from({ length: n + 1 }, () => new Int32Array(m + 1));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      lcs[i][j] = tagged[j].forms.has(words[i])
        ? lcs[i + 1][j + 1] + 1
        : Math.max(lcs[i + 1][j], lcs[i][j + 1]);
    }
  }

  const anchors: [number, number][] = [];
  for (let i = 0, j = 0; i < n && j < m; ) {
    if (tagged[j].forms.has(words[i])) anchors.push([i++, j++]);
    else if (lcs[i + 1][j] >= lcs[i][j + 1]) i++;
    else j++;
  }

  const pairs = new Map<number, number>(anchors);
  const used = new Set(pairs.values());
  for (let i = 0; i < n; i++) {
    if (pairs.has(i)) continue;
    const j = tagged.findIndex((t, k) => !used.has(k) && t.forms.has(words[i]));
    if (j === -1) continue;
    pairs.set(i, j);
    used.add(j);
  }

  // The verse edges act as matched neighbours
  const pairOf = (i: number) => (i === -1 ? -1 : i === n ? m : pairs.get(i));
  for (let i = 0; i < n; i++) {
    if (pairs.has(i)) continue;
    const before = pairOf(i - 1);
    const after = pairOf(i + 1);
    if (before === undefined || after !== before + 2 || used.has(before + 1)) continue;
    pairs.set(i, before + 1);
    used.add(before + 1);
  }
  return pairs;
}

// Whitespace is kept as its own token so joining token text reproduces the verse.
// TODO: fall back for dStrongs missing from the extended lexicon
// (eg bare G2453 -> G2453G, H0430J) — see scripts/lexicons/README.md
export function tokenizeVerse(text: string, tagged: TaggedWord[]): Token[] {
  const parts = text.split(/(\s+)/).filter(Boolean);

  const wordIndexes = parts.flatMap((part, i) => (/\S/.test(part) ? [i] : []));
  const pairs = align(
    wordIndexes.map((i) => normalizeGreek(parts[i])),
    tagged,
  );

  const tokens: Token[] = parts.map((part) => ({ text: part }));
  wordIndexes.forEach((partIndex, wordIndex) => {
    const taggedIndex = pairs.get(wordIndex);
    if (taggedIndex !== undefined) {
      tokens[partIndex].lexiconEntryIds = [tagged[taggedIndex].dStrong];
    }
  });
  return tokens;
}
