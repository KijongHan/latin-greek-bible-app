import { buildLexiconStatisticsFile } from "./build-lexicon-statistics-file";

const TSV_URL = new URL(
  "../../vendor/macula-greek/SBLGNT/tsv/macula-greek-SBLGNT.tsv",
  import.meta.url,
);

async function main() {
  await buildLexiconStatisticsFile(TSV_URL, "grc");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
