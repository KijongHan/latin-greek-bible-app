# Lexicons

Two Strong's-keyed lexicons are generated here. **`extended-strongs` is the source of truth**; `base-strongs` is kept only for the fields extended lacks. A separate Latin lexicon lives in [`latin/`](#latin).

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

## Latin

`latin/` generates a Latin lexicon from **Lewis & Short** (Perseus TEI, `vendor/perseus-lexica/CTS_XML_TEI/perseus/pdllex/lat/ls/lat.ls.perseus-eng2.xml`) and writes 51,645 entries to `latin/output/latin-lewis-short.json`. The Vulgate has no Strong's numbers, so these entries are keyed separately from the Greek and Hebrew lexicons.

Lewis & Short is used because it is the most complete openly licensed Latin–English dictionary, and it often cites the Vulgate directly. Its weak spot is late and ecclesiastical vocabulary.

Entries are a `LatinLexiconEntry`: the shared `LexiconEntry` with `language: "lat"`, plus `entryType` and `senses`. All lexicon types live in `shared/types.ts`. Greek and Hebrew entries are `StrongsLexiconEntry`, which adds `eStrong` / `dStrong` / `uStrong`; Latin has no Strong's numbers, so it has none of those fields.

| Field | Example | Notes |
|---|---|---|
| `id` | `dico2`, `malum1`, `verbum` | The L&S `key`. Homographs are numbered. Unique across the file |
| `lemma` | `Ābrăham, Ābram` | Every `<orth>` in the head, with quantity marks, comma-separated like STEP's `α, Ἀλφα` |
| `transliteration` | `Abraham` | The first form as letters only, for matching lemmatizer output. Keeps case and `j`/`v`, as the Clementine does (`Jesus`, `ejus`) |
| `gloss` | `""` | TODO, see below |
| `definition` | `Ābrăham or Ābram, indecl. or ae, m., __I. Abraham (eccl. Lat.).— __II. …` | The head, then each sense numbered with `__`, as in STEP's definitions |
| `morphRaw` | `xi, ctum, 3, v. a.` | L&S `<itype>`, `<gen>` and `<pos>` from the head, as written |
| `morph` | `{ language: "L", partOfSpeech: "verb" }` | `partOfSpeech` and `gender` are best effort, see below |
| `entryType` | `main` | L&S `type`: `main` (40,042), `greek` (Greek loanword, 4,917), `hapax` (4,481), `gloss` (known only from ancient glossaries, 1,838), `spur` (spurious reading, 256), `foreign` (111). Lemma matching should prefer `main` |
| `senses` | `{ id: "n173.2", level: 2, n: "A", text: "Abrāhămĭdes, ae, m., a descendant of Abraham …" }` | Each `<sense>` with its L&S id and level, so the I → A → 1 → a outline can be rebuilt. `n` alone is ambiguous, since Perseus repeats numbers (`ecclesia` has two `I`s) |

### Parsing notes

- **Head vs senses:** forms and grammar are read only from the head, before the first `<sense>`. Later senses hold derived words with their own tags (`Abrahamides` under `Abraham`).
- **Senses opened too early:** in 1,824 entries Perseus opens the first `<sense>` inside a parenthesis of the head, eg `verbum, i (<sense>gen. plur. verbūm, …), n.`. When the head's parentheses don't balance, the head runs on through that sense, and that sense is left out of `senses` and isn't numbered in `definition`.
- **Part of speech** comes from `<pos>`, a `<gen>` (noun), or a `conj.` / `pron. pers.`-style marker at the start of the first sense. Tags inside parentheses are ignored, since they describe old forms (`is, ea, id (m. eis, …; n. it, …)`). About 9,900 entries are left without one, mostly pronouns and function words like `is`, `qui`, `sum`. The tokenizer should take POS from its lemmatizer and use this only to choose between homographs.
- **Cyrillic ў:** L&S writes y-breve as `ў`, so `transliteration` maps its base `у` to `y`.

### TODO

- **`gloss`** for popovers. L&S senses are long and start with grammar notes, so glosses will come from Whitaker's Words, matched by `transliteration` and part of speech.
- **Lemmatizing the Clementine** and resolving lemmas to L&S ids, by `transliteration` and part of speech (LatinCy).
- **Latin occurrence stats** in `lexicons-analytics`, which only counts TAGNT / TAHOT dStrongs today.

## Tokenizing verses

Verse tokenizing (Greek and BSB) lives in [`tokenize/`](../tokenize/README.md).

## Sources and licences

- [Clear Bible Word Alignments](https://github.com/Clear-Bible/Alignments) — CC BY 4.0, © Clear Bible / Biblica. The BSB alignments were created by BiblioNexus.
- [SBLGNT](https://github.com/LogosBible/SBLGNT) (in Clear's `SBLGNT.tsv`) — CC BY 4.0, © 2010 Society of Biblical Literature and Logos Bible Software.
- [STEPBible data](https://github.com/STEPBible/STEPBible-Data) (TAGNT, TAHOT, TBESG, TBESH, TEGMC, TEHMC) — CC BY 4.0, STEPBible.org / Tyndale House. STEP asks for a note of changes, and asks that the data be referred back to its GitHub rather than redistributed.
- [Berean Standard Bible](https://berean.bible/terms.htm) — public domain. Attribution is appreciated but not required.
- [King James Version with Strong's numbers](https://ebible.org/details.php?id=eng-kjv2006) (eBible.org `eng-kjv2006`) — public domain outside the UK, courtesy of CrossWire Bible Society and eBible.org. "You may copy the King James Version of the Holy Bible freely." The Crown's letters patent restrict printing in the UK only.
- [Westminster Leningrad Codex](https://tanach.us/) — "may be viewed or copied without restriction". Citation is appreciated.
- [Lewis & Short, *A Latin Dictionary*](https://github.com/PerseusDL/lexica) (Perseus TEI) — CC BY-SA 4.0. Perseus asks for this credit: "Text provided under a CC BY-SA license by Perseus Digital Library, http://www.perseus.tufts.edu, with funding from The National Endowment for the Humanities. Data accessed from https://github.com/PerseusDL/lexica/ [date of access]." They also ask to be offered any modifications. **ShareAlike:** data derived from it, including `latin/output/`, must stay CC BY-SA.

CC BY 4.0 requires credit, a link to the licence, and an indication that the data was changed. The app needs an attributions page before shipping data derived from these sources.

## Regenerating

Base reads the extended output to borrow morph data, so generate extended first:

```bash
cd scripts
pnpm run generate:lexicons:extended:greek
pnpm run generate:lexicons:extended:hebrew
pnpm run generate:lexicons:base:greek
pnpm run generate:lexicons:base:hebrew
pnpm run generate:lexicons:latin
```

Outputs go to `*/output/` and are gitignored.
