import * as fs from "node:fs/promises";
import { LexiconEntry, parseTbesFile } from "./parse-tbes";

const TBESH_URL = new URL(
  "../../vendor/stepbible-data/Lexicons/TBESH - Translators Brief lexicon of Extended Strongs for Hebrew - STEPBible.org CC BY.txt",
  import.meta.url,
);

const OUTPUT_URL = new URL(
  "./output/hebrew-strongs-extended.json",
  import.meta.url,
);
const OUTPUT_DIR_URL = new URL("./output/", import.meta.url);

async function main() {
  console.log("Parsing TBESH...");

  const rows = await parseTbesFile(TBESH_URL, "H");
  console.log(`Parsed ${rows.length} raw rows`);

  const entries: LexiconEntry[] = rows.map((row) => ({
    id: `hbo:${row.dStrong}`,
    language: "hbo",
    ...row,
  }));

  const dedup = new Map<string, LexiconEntry>();
  for (const entry of entries) {
    if (!dedup.has(entry.id)) dedup.set(entry.id, entry);
  }
  const unique = Array.from(dedup.values());

  console.log(`Deduplicated to ${unique.length} unique entries by id`);

  await fs.mkdir(OUTPUT_DIR_URL, { recursive: true });
  await fs.writeFile(OUTPUT_URL, JSON.stringify(unique, null, 2), "utf-8");

  console.log(`Wrote ${OUTPUT_URL.pathname}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
