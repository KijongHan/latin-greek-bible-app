import * as fs from "node:fs/promises";
import { LexiconEntry, parseTbesFile } from "./parse-tbes";

const TBESG_URL = new URL(
  "../../vendor/stepbible-data/Lexicons/TBESG - Translators Brief lexicon of Extended Strongs for Greek - STEPBible.org CC BY.txt",
  import.meta.url,
);

const OUTPUT_URL = new URL(
  "./output/greek-strongs-extended.json",
  import.meta.url,
);
const OUTPUT_DIR_URL = new URL("./output/", import.meta.url);

async function main() {
  console.log("Parsing TBESG...");

  const rows = await parseTbesFile(TBESG_URL, "G");
  console.log(`Parsed ${rows.length} raw rows`);

  const entries: LexiconEntry[] = rows.map((row) => ({
    id: `grc:${row.dStrong}`,
    language: "grc",
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
