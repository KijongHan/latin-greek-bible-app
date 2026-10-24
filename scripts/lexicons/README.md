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
