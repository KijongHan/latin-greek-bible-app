import { bibleIdsToParse } from "./constants";
import { parseBibleData } from "./parser";

async function uploadBibleData() {
  const data = await Promise.all(bibleIdsToParse.map(parseBibleData));
}

uploadBibleData();
