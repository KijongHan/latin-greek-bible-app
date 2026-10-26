import { argv } from "node:process";
import {
  bibleEditions,
  loadTagnt,
  tokenizeVersesFile,
} from "./tokenize";

async function main(bibleIds: string[]) {
  const tagnt = await loadTagnt();
  for (const bibleId of bibleIds) {
    await tokenizeVersesFile(bibleId, tagnt);
  }
}

const [, , ...args] = argv;
const bibleIds = Object.keys(bibleEditions).filter(
  (id) => args.length === 0 || args.includes(id),
);

main(bibleIds).catch((err) => {
  console.error(err);
  process.exit(1);
});
