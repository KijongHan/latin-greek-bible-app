import { buildLexiconStatisticsFile } from "./build-lexicon-statistics-file";

const TAGNT_DIR = "../../vendor/stepbible-data/Translators Amalgamated OT+NT/";

const TAGNT_URLS = [
  "TAGNT Mat-Jhn - Translators Amalgamated Greek NT - STEPBible.org CC-BY.txt",
  "TAGNT Act-Rev - Translators Amalgamated Greek NT - STEPBible.org CC-BY.txt",
].map((file) => new URL(`${TAGNT_DIR}${file}`, import.meta.url));

async function main() {
  await buildLexiconStatisticsFile(TAGNT_URLS, "grc");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
