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

// Grammar labels that L&S italicises like its translations, eg "gen. plur.",
// "Subst.", "fin."
const GRAMMAR_LABELS = new Set(
  `fin init med absol subst substt gen comp compp plur adj adjj adv advv adverb
  pass inf infin sup acc accs perf perff act neutr neut dat n cr a part partt
  sing p impers subj abl fem no dim pres masc nom fut pron pronn indic num
  imperf f pers ext v dep depon obj verb m rel conj pa pluperf plupf plqpf
  finit imper imperat indef sync praes prep prepp praep praepp tr gerund posit
  interrog temp tempp prop propr patr patron distr distrib voc intens imp comm
  com reflex desid pl ord ordin indecl collect al demonstr card histor freq sc
  signif mid c s poss possess neg d partit object intr ind subject defect arch
  irreg abstr redupl pos locat loc genit supin subjunct partic instrum predic
  etc cf lit trop fig transf poet ib`.split(/\s+/),
);

// Italicised words that are English even though L&S also has them as Latin
const ENGLISH_WORDS = new Set(["a", "i", "an", "in", "is", "me", "to", "at", "as", "o", "ah", "oh", "alas", "no", "so", "it"]);

const GLOSS_MAX_LENGTH = 60;

function isGlossPiece(piece: string, latinForms: Set<string>): boolean {
  const lower = piece.toLowerCase().replace(/\.$/, "");
  const words = lower.replace(/\./g, " ").trim().split(/\s+/);
  if (piece.includes(".") && words.every((w) => GRAMMAR_LABELS.has(w))) return false;
  // A lone Latin word, eg a variant form or construction (ad, ut)
  if (!lower.includes(" ") && latinForms.has(lower) && !ENGLISH_WORDS.has(lower)) return false;
  // Stems and suffixes, eg "au-"
  if (/^-|-$/.test(piece)) return false;
  return /\p{L}{2}/u.test(piece) || lower === "i";
}

// L&S italicises its English translations: "terra, ae, f., the earth, …".
// The gloss is the italic phrases of the first part of the entry that has
// any, leaving out etymologies, citations, Greek and anything in brackets.
// That part is the head, then each sense in turn, since the translation often
// follows the grammar in the head or opens the first sense.
function extractGloss(body: string, latinForms: Set<string>): string {
  let text = body.replace(/<(etym|cit|bibl|foreign)\b[\s\S]*?<\/\1>/g, "");
  let previous;
  do {
    previous = text;
    text = text.replace(/\([^()]*\)|\[[^[\]]*\]/g, "");
  } while (text !== previous);

  for (const part of text.split("</sense>")) {
    const pieces = tagTexts(part, "hi")
      .flatMap((italic) => italic.split(/[;:,]/))
      .map((piece) => piece.trim())
      .filter((piece) => isGlossPiece(piece, latinForms))
      .map((piece) => piece.replace(/\.+$/, ""));
    if (pieces.length === 0) continue;

    let gloss = "";
    for (const piece of new Set(pieces)) {
      if (gloss && gloss.length + piece.length > GLOSS_MAX_LENGTH) break;
      gloss = gloss ? `${gloss}, ${piece}` : piece;
    }
    return gloss;
  }
  return "";
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
  const latinForms = new Set(
    tagTexts(xml, "orth").map((orth) => toPlainSpelling(orth).toLowerCase()),
  );

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
      gloss: extractGloss(body, latinForms),
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
