import { buildBaseStrongsFile } from "./build-base-strongs-file";

const DICTIONARY_URL = new URL(
  "../../../vendor/openscriptures-strongs/greek/strongs-greek-dictionary.js",
  import.meta.url,
);

const EXTENDED_URL = new URL(
  "../extended-strongs/output/greek-strongs-extended.json",
  import.meta.url,
);

async function main() {
  await buildBaseStrongsFile(DICTIONARY_URL, EXTENDED_URL, "G");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
