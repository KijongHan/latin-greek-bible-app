import { tokenizeKjv, writeTokenizedKjv } from "./tokenize";

async function main() {
  await writeTokenizedKjv(await tokenizeKjv());
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
