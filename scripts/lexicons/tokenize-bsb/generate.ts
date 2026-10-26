import { argv } from "node:process";
import {
  tokenizeBsbTestament,
  writeTokenizedBsb,
  type Testament,
} from "./tokenize-bsb-file";

async function main(testaments: Testament[]) {
  const verses = [];
  for (const testament of testaments) {
    verses.push(...(await tokenizeBsbTestament(testament)));
  }
  await writeTokenizedBsb(verses);
}

const [, , ...args] = argv;
const testaments = (["ot", "nt"] as const).filter(
  (t) => args.length === 0 || args.includes(t),
);

main([...testaments]).catch((err) => {
  console.error(err);
  process.exit(1);
});
