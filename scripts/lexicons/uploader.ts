import * as fs from "node:fs/promises";
import { argv } from "node:process";
import { firebaseLexiconMutations } from "@bible-app/firebase";
import type { LexiconEntry } from "./shared/types";

// Every lexicon that verse tokens reference. Ids are unique across them, so
// each entry is stored once, keyed by its id.
const lexiconFiles = [
  "./extended-strongs/output/greek-strongs-extended.json",
  "./extended-strongs/output/hebrew-strongs-extended.json",
  "./latin/output/latin-lewis-short.json",
];

async function main(files: string[]) {
  // Fail before uploading anything if a lexicon hasn't been generated
  const missing: string[] = [];
  for (const file of files) {
    await fs.access(new URL(file, import.meta.url)).catch(() => missing.push(file));
  }
  if (missing.length > 0) {
    throw new Error(`Missing lexicon output, run its generate script first: ${missing.join(", ")}`);
  }

  for (const file of files) {
    const entries: LexiconEntry[] = JSON.parse(
      await fs.readFile(new URL(file, import.meta.url), "utf-8"),
    );
    console.log(`Batch-uploading ${entries.length} entries of ${file}...`);
    await firebaseLexiconMutations.upsertLexiconEntries(entries);
    console.log(`Finished uploading ${file}`);
  }
}

// Optionally limit to some lexicons by name, eg latin-lewis-short
const [, , ...args] = argv;
const files = lexiconFiles.filter(
  (file) => args.length === 0 || args.some((name) => file.endsWith(`/${name}.json`)),
);

main(files)
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
