"""Lemmatize Latin bibles with LatinCy.

Reads bible-databases/output/verses/{bibleId}.json and writes
latin/output/{bibleId}.lemmas.json: verse id -> [[text, lemma, upos, feats], ...]
for every word LatinCy finds, enclitics split (Dixitque -> Dixit + que).

LatinCy normalizes spelling (cælum -> caelum, Jacob -> Iacob), so `text` is
its normalized form; tokenize.ts aligns it back to the source words by letter.
"""

import json
import sys
import time
from pathlib import Path

import spacy

HERE = Path(__file__).parent
VERSES_DIR = HERE / "../../bible-databases/output/verses"
OUTPUT_DIR = HERE / "output"
LATIN_BIBLE_IDS = ["VulgClementine"]


def lemmatize(bible_id: str, nlp) -> None:
    verses = json.loads((VERSES_DIR / f"{bible_id}.json").read_text("utf-8"))
    texts = ["".join(t["text"] for t in verse["tokens"]) for verse in verses]
    print(f"Lemmatizing {len(verses)} {bible_id} verses...")

    start = time.time()
    lemmas = {}
    for verse, doc in zip(verses, nlp.pipe(texts, batch_size=256)):
        lemmas[verse["id"]] = [
            [t.text, t.lemma_, t.pos_, str(t.morph)]
            for t in doc
            if not t.is_punct and not t.is_space
        ]
        if len(lemmas) % 5000 == 0:
            print(f"  {len(lemmas)} verses ({time.time() - start:.0f}s)")

    OUTPUT_DIR.mkdir(exist_ok=True)
    output = OUTPUT_DIR / f"{bible_id}.lemmas.json"
    output.write_text(json.dumps(lemmas, ensure_ascii=False), "utf-8")
    print(f"Wrote {output.resolve()}")


def main(args: list[str]) -> None:
    # The parser and NER aren't used, and are the slowest components
    nlp = spacy.load("la_core_web_lg", exclude=["parser", "ner"])
    for bible_id in LATIN_BIBLE_IDS:
        if not args or bible_id in args:
            lemmatize(bible_id, nlp)


if __name__ == "__main__":
    main(sys.argv[1:])
