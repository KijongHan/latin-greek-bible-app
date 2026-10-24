import { argv } from "node:process";
import { bibleIdsToParse } from "./constants";
import { parseBibleData } from "./parser";

const [, , ...args] = argv;
const bibleIds = bibleIdsToParse.filter(
  (id) => args.length === 0 || args.includes(id),
);

Promise.all(bibleIds.map(parseBibleData)).catch((err) => {
  console.error(err);
  process.exit(1);
});
