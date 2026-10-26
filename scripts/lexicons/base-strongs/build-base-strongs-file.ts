import * as fs from "node:fs/promises";
import type {
  BaseStrongsEntry,
  ParsedMorph,
  StrongsLexiconEntry,
} from "../shared/types";
import { buildBaseStrongsData } from "./build-base-strongs-data";

const OUTPUT_DIR_URL = "./output/";

function stripLexicalSuffix(eStrong: string): string {
  return eStrong.replace(/[a-z]+$/, "");
}

function deriveMorphByBase(
  extended: StrongsLexiconEntry[],
): Map<string, { morphRaw: string; morph: ParsedMorph }> {
  const groups = new Map<string, StrongsLexiconEntry[]>();
  for (const entry of extended) {
    if (!entry.morphRaw) continue;
    const base = stripLexicalSuffix(entry.eStrong);
    if (!groups.has(base)) groups.set(base, []);
    groups.get(base)!.push(entry);
  }

  const canonical = new Map<
    string,
    { morphRaw: string; morph: ParsedMorph }
  >();

  for (const [base, entries] of groups) {
    const counts = new Map<string, number>();
    for (const e of entries) {
      counts.set(e.morphRaw, (counts.get(e.morphRaw) ?? 0) + 1);
    }
    const [winningMorphRaw] = [...counts.entries()].sort(
      (a, b) => b[1] - a[1],
    )[0];
    const winningEntry = entries.find((e) => e.morphRaw === winningMorphRaw)!;
    canonical.set(base, {
      morphRaw: winningMorphRaw,
      morph: winningEntry.morph,
    });
  }

  return canonical;
}

export async function buildBaseStrongsFile(
  dictionaryFileUrl: URL,
  extendedJsonUrl: URL,
  prefix: "H" | "G",
) {
  const language = prefix === "H" ? "Hebrew" : "Greek";
  console.log(
    `Building ${language} base Strong's lexicon from openscriptures...`,
  );

  const raw = await fs.readFile(dictionaryFileUrl, "utf-8");
  const varName = `strongs${prefix === "H" ? "Hebrew" : "Greek"}Dictionary`;
  const factory = new Function(
    "module",
    `var module = { exports: {} };\n${raw}\nreturn ${varName};`,
  );
  const dictionary = factory({});
  console.log(`Loaded ${Object.keys(dictionary).length} raw entries`);

  const entries: BaseStrongsEntry[] = buildBaseStrongsData(dictionary, prefix);
  console.log(`Built ${entries.length} base Strong's entries`);

  const extendedContent = await fs.readFile(extendedJsonUrl, "utf-8");
  const extended: StrongsLexiconEntry[] = JSON.parse(extendedContent);
  console.log(`Loaded ${extended.length} extended entries for morph enrichment`);

  const morphByBase = deriveMorphByBase(extended);
  let enrichedCount = 0;
  for (const entry of entries) {
    const derived = morphByBase.get(entry.id);
    if (derived) {
      entry.morphRaw = derived.morphRaw;
      entry.morph = derived.morph;
      if (derived.morph.language === "A") entry.language = "arc";
      enrichedCount++;
    }
  }
  console.log(
    `Enriched ${enrichedCount}/${entries.length} base entries with morph`,
  );

  await fs.mkdir(new URL(OUTPUT_DIR_URL, import.meta.url), { recursive: true });
  const outputFileUrl = new URL(
    `${OUTPUT_DIR_URL}${prefix === "H" ? "hebrew" : "greek"}-strongs-base.json`,
    import.meta.url,
  );
  await fs.writeFile(outputFileUrl, JSON.stringify(entries, null, 2), "utf-8");

  console.log(`Wrote ${outputFileUrl.pathname}`);
}
