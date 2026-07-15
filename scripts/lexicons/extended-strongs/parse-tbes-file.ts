import * as fs from "node:fs/promises";
import { LexiconEntry, parseTbesData } from "./parse-tbes-data";

const OUTPUT_DIR_URL = "./output/";

export async function parseTbesFile(fileUrl: URL, prefix: "H" | "G") {
  console.log(
    `Parsing ${prefix === "H" ? "Hebrew" : "Greek"} TBES${prefix}...`,
  );
  const content = await fs.readFile(fileUrl, "utf-8");

  const rows = await parseTbesData(content, prefix);
  console.log(`Parsed ${rows.length} raw rows`);

  const entries: LexiconEntry[] = rows.map((row) => ({
    id: `hbo:${row.dStrong}`,
    language: "hbo",
    ...row,
  }));

  const dedup = new Map<string, LexiconEntry>();
  for (const entry of entries) {
    if (!dedup.has(entry.id)) dedup.set(entry.id, entry);
  }
  const unique = Array.from(dedup.values());

  console.log(`Deduplicated to ${unique.length} unique entries by id`);

  await fs.mkdir(new URL(OUTPUT_DIR_URL, import.meta.url), { recursive: true });
  const outputFileUrl = new URL(
    `${OUTPUT_DIR_URL}${prefix === "H" ? "hebrew" : "greek"}-strongs-extended.json`,
    import.meta.url,
  );
  await fs.writeFile(outputFileUrl, JSON.stringify(unique, null, 2), "utf-8");

  console.log(`Wrote ${outputFileUrl.pathname}`);
}
