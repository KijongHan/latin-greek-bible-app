import { getVerseId, type Token } from "@bible-app/domain";

// Merged words carry several tags, eg κἀκεῖνος = "and" + "that one"
export interface Tags {
  dStrongs: string[];
  morphs: string[];
}

export interface TaggedWord extends Tags {
  forms: Set<string>;
}

export interface TaggedVerseWord extends Tags {
  form: string;
  spellings: string[];
  editions: string[];
  variants: (Tags & { forms: string[]; editions: string[] })[];
}

// eg "Mat.1.1#01=NKO", "Act.2.11[2.10]#01=NKO" or "Gen.31.55(32.1)#01=L" — NRSV ref first, then
// [KJV], (NA or Hebrew) and {other} refs where they differ
const WORD_REF = /^(\w{3})\.(\d+)\.(\d+)(?:\[[^\]]*\]|\([^)]*\)|\{[^}]*\})*#\d+=/;

// Accents, case, final sigma and punctuation all differ between editions
export function normalizeGreek(word: string): string {
  return word
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/ς/g, "σ")
    .replace(/[^\p{L}]/gu, "");
}

// Only the consonants: drops vowel points, cantillation, maqqef, sof pasuq and TAHOT's "/" part markers
export function normalizeHebrew(word: string): string {
  return word.replace(/[^א-ת]/g, "");
}

// "NA28+TR«3+Byz«3" — «n / »n mark the word as moved in that edition
function parseEditions(field: string): string[] {
  return field
    .trim()
    .split("+")
    .map((edition) => edition.replace(/[«»*].*$/, ""));
}

// "G1083=N-NSF" or "G2532=CONJ + G1565=D-NSM"
function parseTags(field: string): Tags {
  const tags = field.split(" + ").map((tag) => tag.trim().split("="));
  return {
    dStrongs: tags.map(([dStrong]) => dStrong),
    morphs: tags.map(([, morph = ""]) => morph),
  };
}

// "γέννησις (t=gennēsis) birth - G1083=N-NSF in: TR+Byz ¦ …"
function parseMeaningVariants(field: string): TaggedVerseWord["variants"] {
  if (!field) return [];
  return field.split("¦").flatMap((variant) => {
    const split = variant.lastIndexOf(" - ");
    if (split === -1) return [];
    const [greek] = variant.slice(0, split).split(" (");
    const match = variant.slice(split + 3).match(/^(G\d+[A-Za-z]?=.*?) in: (.+)$/);
    if (!match) return [];
    return [
      {
        forms: greek.trim().split(/\s+/).map(normalizeGreek).filter(Boolean),
        ...parseTags(match[1]),
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
      ...parseTags(cols[3]),
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
          dStrongs: word.dStrongs,
          morphs: word.morphs,
        },
      ];
    }
    const variant = word.variants.find((v) => v.editions.includes(edition));
    if (!variant) return [];
    // A multi-word variant with one tag per word, eg "καὶ τοι γε", splits its tags;
    // otherwise every word carries all of them
    const oneTagPerWord = variant.forms.length === variant.dStrongs.length;
    return variant.forms.map((form, i) => ({
      forms: new Set([form]),
      dStrongs: oneTagPerWord ? [variant.dStrongs[i]] : variant.dStrongs,
      morphs: oneTagPerWord ? [variant.morphs[i]] : variant.morphs,
    }));
  });
}

export interface TahotWord extends Tags {
  text: string;
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
      text: cols[1],
      dStrongs: parts.map((p) => p.replace(/[{}+\s]/g, "")),
      // Later parts never repeat the language letter, eg Aramaic "ANcmpd/Ta" → "ANcmpd", "ATa".
      // A Ketiv read as two words (eg אשדת, Deu 33:2) can lack grammar for a part: left empty.
      morphs: parts.map((_, i) => {
        const morph = morphs[i]?.trim() ?? "";
        return i === 0 || !morph ? morph : `${language}${morph}`;
      }),
      root: root === -1 ? parts.length - 1 : root,
    });
  }
  return words;
}

// TAHOT words of each Hebrew verse, in word order, carrying every part's tags
// (eg בְּרֵאשִׁית → H9003 + H7225G)
export function tahotWordsByVerse(
  tahot: Map<string, TahotWord>,
): Map<string, TaggedWord[]> {
  const verses = new Map<string, TaggedWord[]>();
  for (const [key, word] of tahot) {
    const verseId = key.slice(0, key.lastIndexOf("#"));
    if (!verses.has(verseId)) verses.set(verseId, []);
    verses.get(verseId)!.push({
      forms: new Set([normalizeHebrew(word.text.split("\\")[0])]),
      dStrongs: word.dStrongs,
      morphs: word.morphs,
    });
  }
  return verses;
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
// `separator` must capture, so separators stay in the output; an empty capture splits
// without adding a token (eg Hebrew splits after a maqqef: "עַל־פְּנֵי" → "עַל־", "פְּנֵי").
export function tokenizeVerse(
  text: string,
  tagged: TaggedWord[],
  { normalize = normalizeGreek, separator = /(\s+)/ } = {},
): Token[] {
  const parts = text.split(separator).filter(Boolean);

  const wordIndexes = parts.flatMap((part, i) => (/\S/.test(part) ? [i] : []));
  const pairs = align(
    wordIndexes.map((i) => normalize(parts[i])),
    tagged,
  );

  const tokens: Token[] = parts.map((part) => ({ text: part }));
  wordIndexes.forEach((partIndex, wordIndex) => {
    const taggedIndex = pairs.get(wordIndex);
    if (taggedIndex === undefined) return;
    const { dStrongs, morphs } = tagged[taggedIndex];
    tokens[partIndex].lexiconEntryIds = dStrongs;
    tokens[partIndex].morphCodeIds = morphs;
  });
  return tokens;
}
