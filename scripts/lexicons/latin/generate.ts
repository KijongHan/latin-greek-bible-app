import * as fs from "node:fs/promises";
import { parseLewisShort } from "./parse-lewis-short";

const LEWIS_SHORT_URL = new URL(
  "../../../vendor/perseus-lexica/CTS_XML_TEI/perseus/pdllex/lat/ls/lat.ls.perseus-eng2.xml",
  import.meta.url,
);
const OUTPUT_DIR_URL = new URL("./output/", import.meta.url);

async function main() {
  console.log("Parsing Lewis & Short...");
  const xml = await fs.readFile(LEWIS_SHORT_URL, "utf-8");
  const entries = parseLewisShort(xml);
  console.log(`Parsed ${entries.length} entries`);

  await fs.mkdir(OUTPUT_DIR_URL, { recursive: true });
  const outputFileUrl = new URL("latin-lewis-short.json", OUTPUT_DIR_URL);
  await fs.writeFile(outputFileUrl, JSON.stringify(entries, null, 2), "utf-8");
  console.log(`Wrote ${outputFileUrl.pathname}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
