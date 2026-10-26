import * as fs from "node:fs/promises";
import { parseTahot, type TahotWord } from "../shared/parser";

const TAHOT_DIR = "../../../vendor/stepbible-data/Translators Amalgamated OT+NT/";
const TAHOT_URLS = [
  "TAHOT Gen-Deu - Translators Amalgamated Hebrew OT - STEPBible.org CC BY.txt",
  "TAHOT Jos-Est - Translators Amalgamated Hebrew OT - STEPBible.org CC BY.txt",
  "TAHOT Job-Sng - Translators Amalgamated Hebrew OT - STEPBible.org CC BY.txt",
  "TAHOT Isa-Mal - Translators Amalgamated Hebrew OT - STEPBible.org CC BY.txt",
].map((file) => new URL(`${TAHOT_DIR}${file}`, import.meta.url));

export async function loadTahot(): Promise<Map<string, TahotWord>> {
  const contents = await Promise.all(
    TAHOT_URLS.map((url) => fs.readFile(url, "utf-8")),
  );
  return parseTahot(contents.join("\n"));
}
