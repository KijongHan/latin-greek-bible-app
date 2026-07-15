import * as fs from "node:fs/promises";
import { LexiconEntry, parseTbesData } from "./parse-tbes-data";
import { parseTbesFile } from "./parse-tbes-file";

const TBESG_URL = new URL(
  "../../../vendor/stepbible-data/Lexicons/TBESG - Translators Brief lexicon of Extended Strongs for Greek - STEPBible.org CC BY.txt",
  import.meta.url,
);

async function main() {
  await parseTbesFile(TBESG_URL, "G");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
