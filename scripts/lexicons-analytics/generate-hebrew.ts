import { buildLexiconStatisticsFile } from "./build-lexicon-statistics-file";

const TAHOT_DIR = "../../vendor/stepbible-data/Translators Amalgamated OT+NT/";

const TAHOT_URLS = [
  "TAHOT Gen-Deu - Translators Amalgamated Hebrew OT - STEPBible.org CC BY.txt",
  "TAHOT Jos-Est - Translators Amalgamated Hebrew OT - STEPBible.org CC BY.txt",
  "TAHOT Job-Sng - Translators Amalgamated Hebrew OT - STEPBible.org CC BY.txt",
  "TAHOT Isa-Mal - Translators Amalgamated Hebrew OT - STEPBible.org CC BY.txt",
].map((file) => new URL(`${TAHOT_DIR}${file}`, import.meta.url));

async function main() {
  await buildLexiconStatisticsFile(TAHOT_URLS, "hbo");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
