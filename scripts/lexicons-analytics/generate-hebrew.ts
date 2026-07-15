import { buildLexiconStatisticsFile } from "./build-lexicon-statistics-file";

const TSV_URL = new URL(
  "../../vendor/macula-hebrew/WLC/tsv/macula-hebrew.tsv",
  import.meta.url,
);

async function main() {
  await buildLexiconStatisticsFile(TSV_URL, "hbo");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
