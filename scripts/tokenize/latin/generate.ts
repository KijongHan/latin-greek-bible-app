import { argv } from "node:process";
import { latinBibleIds, loadLexicon, loadNames, tokenizeLatinFile } from "./tokenize";

async function main(bibleIds: string[]) {
  const lexicon = await loadLexicon();
  const names = await loadNames();
  for (const bibleId of bibleIds) {
    await tokenizeLatinFile(bibleId, lexicon, names);
  }
}

const [, , ...args] = argv;
const bibleIds = latinBibleIds.filter(
  (id) => args.length === 0 || args.includes(id),
);

main(bibleIds).catch((err) => {
  console.error(err);
  process.exit(1);
});
