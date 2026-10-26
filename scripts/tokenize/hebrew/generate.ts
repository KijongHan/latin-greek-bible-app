import { argv } from "node:process";
import { tahotWordsByVerse } from "../shared/parser";
import { hebrewBibleIds, loadTahot, tokenizeHebrewFile } from "./tokenize";

async function main(bibleIds: string[]) {
  const tahot = tahotWordsByVerse(await loadTahot());
  for (const bibleId of bibleIds) {
    await tokenizeHebrewFile(bibleId, tahot);
  }
}

const [, , ...args] = argv;
const bibleIds = hebrewBibleIds.filter(
  (id) => args.length === 0 || args.includes(id),
);

main(bibleIds).catch((err) => {
  console.error(err);
  process.exit(1);
});
