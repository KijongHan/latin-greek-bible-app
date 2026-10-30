import * as fs from "node:fs/promises";
import { parseTipnr } from "../shared/parser";
import { NAMES_URL } from "./tokenize";

const TIPNR_URL = new URL(
  "../../../vendor/stepbible-data/Proper Nouns/TIPNR - Translators Individualised Proper Names with all References - STEPBible.org CC BY.txt",
  import.meta.url,
);

async function main() {
  console.log("Parsing TIPNR...");
  const names = parseTipnr(await fs.readFile(TIPNR_URL, "utf-8"));
  console.log(`Parsed ${names.length} name forms`);

  await fs.mkdir(new URL(".", NAMES_URL), { recursive: true });
  await fs.writeFile(NAMES_URL, JSON.stringify(names, null, 2), "utf-8");
  console.log(`Wrote ${NAMES_URL.pathname}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
