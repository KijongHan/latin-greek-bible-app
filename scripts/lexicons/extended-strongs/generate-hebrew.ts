import { parseTbesFile } from "./parse-tbes-file";

const TBESH_URL = new URL(
  "../../../vendor/stepbible-data/Lexicons/TBESH - Translators Brief lexicon of Extended Strongs for Hebrew - STEPBible.org CC BY.txt",
  import.meta.url,
);

async function main() {
  await parseTbesFile(TBESH_URL, "H");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
