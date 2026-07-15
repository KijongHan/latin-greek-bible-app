import { buildBaseStrongsFile } from "./build-base-strongs-file";

const DICTIONARY_URL = new URL(
  "../../../vendor/openscriptures-strongs/hebrew/strongs-hebrew-dictionary.js",
  import.meta.url,
);

const EXTENDED_URL = new URL(
  "../extended-strongs/output/hebrew-strongs-extended.json",
  import.meta.url,
);

async function main() {
  await buildBaseStrongsFile(DICTIONARY_URL, EXTENDED_URL, "H");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
