# Lexicons

Two Strong's-keyed lexicons are generated here. **`extended-strongs` is the source of truth**; `base-strongs` is kept only for the fields extended lacks.

| | `extended-strongs/` | `base-strongs/` |
|---|---|---|
| Source | STEP TBESG / TBESH (`vendor/stepbible-data/Lexicons/`) | OpenScriptures Strong's (`vendor/openscriptures-strongs/`) |
| `id` | STEP **dStrong**, eg `G2264G`, `H7225G` | Base Strong's, eg `G2264`, `H7225` |
| Entries (Greek / Hebrew) | 11,034 / 11,682 | 5,523 / 8,674 |
| Used for | `Token.lexiconEntryIds`, popover lookups, `lexicons-analytics` stats | Reference only (see below) |

## Decisions

### Extended is the source; tokens reference dStrong

`Token.lexiconEntryIds` (`packages/domain/src/types.ts`) holds dStrong ids from the extended lexicon.

- dStrong is what STEP's tagged texts (TAGNT / TAHOT) use, so ids match without mapping.
- dStrong separates people and senses that share one Strong's number. For example, Herod the Great, Antipas and Agrippa I are `G2264G` / `G2264H` / `G2264I`, while base Strong's has `G2264` for all three.
- It is an array because TAHOT tags one Hebrew word with several Strong's numbers, eg `H9003/{H7225G}` ("in" + "beginning").

Every base number has a matching extended entry, so extended loses no coverage.

### Base is kept for fields extended lacks

STEP's lexicons don't carry these OpenScriptures fields:

- `derivation` — word origin and cross-references, eg G1615 ἐκτελέω "from G1537 (ἐκ) and G5055 (τελέω)". Only a few dozen extended definitions mention derivation.
- `pronunciation` — Hebrew only, eg אָב "awb".
- `kjv_def` — KJV renderings, eg "(be-)love(-ed)". It exists in the raw data but `build-base-strongs-data.ts` doesn't emit it yet.

Base is **not** a lookup source. If these fields are needed, copy them onto extended entries at ingest, matched by base number (strip the suffix from `eStrong`: `G0001G` → `G0001`). Don't look tokens up in base directly.

### Ids

- Ids have no language prefix. The `G`/`H` at the start of the number already identifies the language.
- Numbers are zero-padded to 4 digits (`G0001`), matching STEP's tagged texts.
- Keep base and extended in separate stores: unsuffixed numbers collide (`G0002` is in both, for different records).
- Lowercase suffixes are real dStrongs (eg `H2148v`–`H2148z`, the many Zechariahs).

### Language

`language` is the language of the word itself, taken from STEP's morph code: `A:` → `arc`, otherwise `grc` / `hbo` by the `G`/`H` number. This means the 10 Aramaic phrases quoted in the Greek NT (ταλιθά, ἐφφαθά, μαρὰν ἀθά, …) are `arc`.

### Tagged texts: STEP, not macula

`lexicons-analytics` counts words from STEP's tagged texts (`vendor/stepbible-data/Translators Amalgamated OT+NT/`):

- **TAGNT**: Translators Amalgamated Greek NT.
- **TAHOT**: Translators Amalgamated Hebrew OT.

"Amalgamated" means several editions are merged into one text, and each word is marked with the editions that contain it.

| | STEP (TAGNT / TAHOT) | Macula (Clear Bible) |
|---|---|---|
| Base text | Several editions merged, with variants marked | One edition each: SBLGNT / Nestle 1904 for Greek, WLC for Hebrew |
| Word ids | dStrong (`G2264G` / `G2264H` / `G2264I`) | Plain Strong's (`976`), plus the lemma text (`βίβλος`) and Louw-Nida domains |
| Strengths | Matches the TBESG / TBESH lexicons, shows text variants | Syntax trees, semantic roles, pronoun referents, word glosses |

STEP is used because its dStrong ids match extended lexicon entries directly. Macula only gives plain Strong's numbers, which would need normalising and would lose the sense distinctions.

STEP doesn't replace macula in general. Macula is still the source to use for syntax and discourse data, such as clause structure, subject and object roles, or who a pronoun refers to.

## Tokenize verses

`tokenize-verses/` splits the verses output by `bible-databases/parser.ts` into one token per word. It writes the result to `tokenize-verses/output/{bibleId}.json`. `uploader.ts` then upserts those verses into the Firestore verses collection.

```bash
cd scripts
pnpm run parse:bibles                        # writes bible-databases/output/verses/
pnpm run generate:tokenized-verses [Byz TR]
pnpm run upload:tokenized-verses [Byz TR]
```

- Only bibles with a TAGNT edition are tokenized (`bibleEditions` in `tokenize-verses-file.ts`): `Byz` → `Byz`, `TR` → `TR`.
- Whitespace is kept as its own token without ids, so `tokens.map(t => t.text).join("")` reproduces the source verse exactly. The apps render verses this way.
- Each word token gets `lexiconEntryIds` (dStrongs) and `morphCodeIds` (STEP morph codes, eg `V-AAI-3S`) from TAGNT words in that edition. The two arrays are parallel.
  - Merged words carry one entry per part, eg κἀκεῖνος → `["G2532", "G1565"]` / `["CONJ", "D-NSM"]`.
  - A word missing from the edition is replaced by the edition's meaning variant, with that variant's ids and codes.
  - Edition markers like `Byz«3` (moved word) count as in the edition.
  - Morph codes are per occurrence, unlike the lexicon entry's `morphRaw`, which describes the lemma. Every code is defined in STEP TEGMC. The code table itself isn't generated yet (TODO in `packages/domain/src/types.ts`).
- Words are matched on normalized spelling (no accents, lowercase, `ς` → `σ`, letters only) in this order:
  1. longest common subsequence
  2. exact spelling anywhere in the verse, for words in a different order
  3. a single leftover word between two matched neighbours, for spelling differences

Current coverage: Byz 98.8%, TR 99.4% of words tagged.

### Known gaps

- **Crasis** — Byz/TR `και εκει` vs TAGNT's single word κἀκεῖ. Neither word is tagged.
- **Versification** — 8 verses have no TAGNT match under the same id: `JHN.7.53`, `ROM.16.25–27`, `2CO.13.13–14`, `PHP.1.16–17`.
- **Alternative readings in the source text** — `bible-databases/parser.ts` (`cleanGreekVerseText`) strips the unambiguous noise:
  - Strong's numbers
  - `(N:N)` and `v N` verse markers
  - `{P-GSM}` morph codes
  - `&gt;`
  - TR epistle subscriptions
  - `X OMIT X` variants

  Ambiguous alternative readings are kept as they are and stay untagged:
  - `OR` groups (12 Byz verses)
  - the John 8 `OMIT: … :OMIT` / `:END` passages
  - JHN.1.43
  - unmarked alternatives separated by double spaces in the vendor text
- **dStrongs missing from the extended lexicon** (~540 tokens), eg bare `G2453` where only `G2453G` exists. Needs a fallback (TODO in `tokenize-verses-data.ts`).

## Regenerating

Base reads the extended output to borrow morph data, so generate extended first:

```bash
cd scripts
pnpm run generate:lexicons:extended:greek
pnpm run generate:lexicons:extended:hebrew
pnpm run generate:lexicons:base:greek
pnpm run generate:lexicons:base:hebrew
```

Outputs go to `*/output/` and are gitignored.
