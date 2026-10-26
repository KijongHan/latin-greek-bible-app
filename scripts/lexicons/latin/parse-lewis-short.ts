import type {
  Gender,
  LatinEntryType,
  LatinLexiconEntry,
  LatinSense,
  PartOfSpeech,
} from "../shared/types";

const GENDER_MAP: Record<string, Gender> = {
  "m.": "masculine",
  "f.": "feminine",
  "n.": "neuter",
  "comm.": "common",
  "com.": "common",
};

const ENTRY_RE = /<entryFree\b([^>]*)>([\s\S]*?)<\/entryFree>/g;
const SENSE_RE = /<sense\b([^>]*)>([\s\S]*?)<\/sense>/g;
const SENSE_LEAD_RE = /^\s*<sense\b[^>]*>([^[,(]*)/;

function attr(attrs: string, name: string): string | undefined {
  return attrs.match(new RegExp(`\\b${name}="([^"]*)"`))?.[1];
}

function tagTexts(xml: string, tag: string): string[] {
  const re = new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)</${tag}>`, "g");
  return [...xml.matchAll(re)].map((m) => stripTags(m[1]));
}

function stripTags(xml: string): string {
  return xml
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// Plain spelling for matching against lemmatizer output: letters only, no
// quantity marks or hyphens. L&S writes y-breve with Cyrillic ў, whose base
// is у. Case and j/v are kept, as in the Clementine (Jesus, ejus).
export function toPlainSpelling(orth: string): string {
  return orth
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/у/g, "y")
    .replace(/[^\p{L}]/gu, "");
}

// The head is everything before the first sense. Forms and grammar in later
// senses belong to derived words (eg Abrahamides under Abraham). Perseus
// sometimes opens the first sense inside a parenthesis of the head, eg
// "verbum, i (<sense>gen. plur. verbūm, …), n.", so then the head runs on
// through that sense, and that sense isn't numbered in the definition.
function splitHead(body: string): { head: string; senseXml: string } {
  const [head] = body.split(/<sense\b/, 1);
  const text = stripTags(head);
  const firstSense = body.match(/^[\s\S]*?<\/sense>/)?.[0];
  if (!firstSense || text.split("(").length <= text.split(")").length) {
    return { head, senseXml: body.slice(head.length) };
  }
  return { head: firstSense, senseXml: body.slice(firstSense.length) };
}

// Parentheses in the head hold old and variant forms with their own grammar
// tags, eg "is, ea, id (m. eis, …; n. it, …)", so they are left out when
// reading the entry's own part of speech and gender.
function outsideParentheses(xml: string): string {
  let previous;
  do {
    previous = xml;
    xml = xml.replace(/\([^()]*\)/g, "");
  } while (xml !== previous);
  return xml;
}

const PRONOUN_MAP: [RegExp, PartOfSpeech][] = [
  [/pron\. pers/, "pronoun_personal"],
  [/pron\. (?:poss|possess)/, "pronoun_possessive"],
  [/pron\. reflex/, "pronoun_reflexive"],
  [/pron\. rel/, "pronoun_relative"],
  [/pron\. demonstr/, "pronoun_demonstrative"],
];

function partOfSpeech(
  posRaw: string,
  headText: string,
  hasGender: boolean,
): PartOfSpeech | undefined {
  for (const [re, pronoun] of PRONOUN_MAP) if (re.test(headText)) return pronoun;
  if (/\bconj\./.test(headText)) return "conjunction";
  const pos = posRaw.toLowerCase();
  if (pos.startsWith("v.")) return "verb";
  if (pos.includes("adj.") || pos === "p. a.") return "adjective";
  if (pos.startsWith("adv.")) return "adverb";
  if (pos.startsWith("prep.")) return "preposition";
  if (pos.startsWith("interj.")) return "interjection";
  if (pos === "subst." || (!pos && hasGender)) return "noun";
  return undefined;
}

// Same shape as the STEP lexicons (extended-strongs), minus the Strong's
// numbers Latin doesn't have. The L&S key is the id.
export function parseLewisShort(xml: string): LatinLexiconEntry[] {
  const entries: LatinLexiconEntry[] = [];

  for (const [, attrs, body] of xml.matchAll(ENTRY_RE)) {
    const id = attr(attrs, "key");
    if (!id) continue;

    const { head, senseXml } = splitHead(body);
    const forms = tagTexts(head, "orth");
    if (forms.length === 0) continue;

    const ownHead = outsideParentheses(head);
    const posRaw = tagTexts(ownHead, "pos").join(" and ");
    const genderRaw = tagTexts(ownHead, "gen");
    const gender = genderRaw
      .map((g) => GENDER_MAP[g])
      .filter((g): g is Gender => g !== undefined);

    // Function words often state their class at the start of the first sense
    // instead, eg "ĕt, <sense>conj. [Sanscr. ati, …]"
    const firstSenseLead = stripTags(senseXml.match(SENSE_LEAD_RE)?.[1] ?? "");
    const pos = partOfSpeech(
      posRaw,
      `${stripTags(ownHead)} ${firstSenseLead}`,
      gender.length > 0,
    );

    const senses: LatinSense[] = [...senseXml.matchAll(SENSE_RE)].map(
      ([, senseAttrs, text]) => ({
        id: attr(senseAttrs, "id") ?? "",
        level: Number(attr(senseAttrs, "level") ?? 1),
        n: attr(senseAttrs, "n") ?? "",
        text: stripTags(text),
      }),
    );

    entries.push({
      id,
      language: "lat",
      lemma: forms.join(", "),
      transliteration: toPlainSpelling(forms[0]),
      gloss: "",
      // Senses are numbered with "__", as in STEP's definitions
      definition: [
        stripTags(head),
        ...senses.map(({ n, text }) => `__${n}. ${text}`),
      ].join(" "),
      morphRaw: [
        tagTexts(head, "itype").join(", "),
        ...genderRaw,
        posRaw,
      ]
        .filter(Boolean)
        .join(", "),
      morph: {
        language: "L",
        ...(pos && { partOfSpeech: pos }),
        ...(gender.length > 0 && { gender: [...new Set(gender)] }),
      },
      entryType: (attr(attrs, "type") ?? "main") as LatinEntryType,
      senses,
    });
  }

  return entries;
}
