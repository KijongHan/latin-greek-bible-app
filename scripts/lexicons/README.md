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

## Tokenizing verses

Verse tokenizing (Greek and BSB) lives in [`tokenize/`](../tokenize/README.md).

## Sources and licences

- [Clear Bible Word Alignments](https://github.com/Clear-Bible/Alignments) — CC BY 4.0, © Clear Bible / Biblica. The BSB alignments were created by BiblioNexus.
- [SBLGNT](https://github.com/LogosBible/SBLGNT) (in Clear's `SBLGNT.tsv`) — CC BY 4.0, © 2010 Society of Biblical Literature and Logos Bible Software.
- [STEPBible data](https://github.com/STEPBible/STEPBible-Data) (TAGNT, TAHOT, TBESG, TBESH, TEGMC, TEHMC) — CC BY 4.0, STEPBible.org / Tyndale House. STEP asks for a note of changes, and asks that the data be referred back to its GitHub rather than redistributed.
- [Berean Standard Bible](https://berean.bible/terms.htm) — public domain. Attribution is appreciated but not required.
- [King James Version with Strong's numbers](https://ebible.org/details.php?id=eng-kjv2006) (eBible.org `eng-kjv2006`) — public domain outside the UK, courtesy of CrossWire Bible Society and eBible.org. "You may copy the King James Version of the Holy Bible freely." The Crown's letters patent restrict printing in the UK only.
- [Westminster Leningrad Codex](https://tanach.us/) — "may be viewed or copied without restriction". Citation is appreciated.

CC BY 4.0 requires credit, a link to the licence, and an indication that the data was changed. The app needs an attributions page before shipping data derived from these sources.

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
