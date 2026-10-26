# Tokenize

Splits verses into one token per word and tags each word with `lexiconEntryIds` (dStrongs from the extended lexicon) and `morphCodeIds` (STEP morph codes). See [`lexicons/README.md`](../lexicons/README.md) for why tokens reference dStrongs, and for sources and licences.

| Folder | Does |
|---|---|
| `greek/` | Tags Greek bibles (Byz, TR) against TAGNT |
| `hebrew/` | Tags Hebrew bibles (WLC) against TAHOT |
| `bsb/` | Builds tagged BSB verses from Clear's word alignments |
| `shared/` | TAGNT and TAHOT parsing, edition selection and word alignment (`parseTagnt`, `parseTahot`, `wordsForEdition`, `tahotWordsByVerse`, `tokenizeVerse`), used by all three |

Each writes to `{folder}/output/`, which is gitignored. Each `uploader.ts` then upserts those verses into the Firestore verses collection.

## Greek

`greek/` tokenizes the verses written by `bible-databases/parser.ts` and writes the result to `greek/output/{bibleId}.json`.

```bash
cd scripts
pnpm run parse:bibles                        # writes bible-databases/output/verses/
pnpm run generate:tokenized-verses [Byz TR]
pnpm run upload:tokenized-verses [Byz TR]
```

- Only bibles with a TAGNT edition are tokenized (`bibleEditions` in `greek/tokenize.ts`): `Byz` → `Byz`, `TR` → `TR`.
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

Current coverage: Byz 98.8%, TR 99.5% of words tagged.

### Known gaps

- **Crasis** — Byz/TR `και εκει` vs TAGNT's single word κἀκεῖ. Neither word is tagged.
- **Versification** — `2CO.13.14` has no TAGNT match under the same id (NRSV numbers it 13:13). TAGNT refs are keyed by the NRSV ref; the `[KJV]`, `(NA)` and `{other}` refs that follow are accepted but not used for matching.
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
- **dStrongs missing from the extended lexicon** (~540 tokens), eg bare `G2453` where only `G2453G` exists. Needs a fallback (TODO in `shared/parser.ts`).

## Hebrew

`hebrew/` tokenizes the WLC verses written by `bible-databases/parser.ts` and writes the result to `hebrew/output/WLC.json`. STEP's TAHOT is built on the Leningrad Codex, so WLC matches it closely.

```bash
cd scripts
pnpm run parse:bibles WLC                    # writes bible-databases/output/verses/WLC.json
pnpm run generate:tokenized-hebrew [WLC]
pnpm run upload:tokenized-hebrew [WLC]
```

- **Words:** split on whitespace and **after a maqqef**, because TAHOT counts maqqef-joined words separately. `עַל־פְּנֵי` becomes `עַל־` + `פְּנֵי` with no space token between them, so joined token text still reproduces the verse.
- **Verse ids:** WLC and TAHOT are matched by **Hebrew** verse number, using the ref in brackets when it differs from English (eg WLC `GEN.32.1` = TAHOT `Gen.31.55(32.1)`).
- **Ids:** each word carries every part's tags, in the same shape as the BSB OT tokens. Eg בְּרֵאשִׁית → `["H9003", "H7225G"]` / `["HR", "HNcfsa"]`; Aramaic words get `A…` codes (Dan 2:4 מַלְכָּא → `ANcbsd`, `ATa`).
- **Matching:** words are compared on consonants only (`normalizeHebrew` drops points, cantillation, maqqef and punctuation), using the same three-step alignment as Greek. Ketiv (`K`) rows and LXX reconstructions (`X`) aren't matched.

Current coverage: 99.6% of words tagged, and every verse is found in TAHOT.

### Known gaps

- **Ketiv/Qere** — where WLC's consonants are the Ketiv and TAHOT's are the Qere, a word can stay untagged. The neighbour step recovers most single-word cases.
- **Ketiv read as two words** (eg אשדת, Deu 33:2) — TAHOT gives a dStrong for each part but grammar for only one. The missing part's morph code is empty (5 tokens).
- **dStrongs missing from the extended lexicon** (383 tokens), mostly `H0430J` and `H3064`. This is the same fallback TODO as Greek.

## BSB

`bsb/` builds BSB verses from Clear's manual word alignments (`vendor/clear-bible-alignments`, a git submodule). Each English word gets the `lexiconEntryIds` and `morphCodeIds` of the Greek or Hebrew word it translates. Tapping an English word therefore reaches the same lexicon entry and morph code as the source word.

```bash
cd scripts
pnpm run generate:tokenized-bsb [ot] [nt]   # writes bsb/output/BSB.json
pnpm run upload:tokenized-bsb
```

| | Alignment | Source words | dStrongs and morph codes from |
|---|---|---|---|
| NT | `SBLGNT-BSB-manual.json` | `sources/SBLGNT.tsv` | TAGNT's `SBL` edition, matched with `tokenizeVerse` from `shared/parser.ts` |
| OT | `WLCM-BSB-manual.json` | `sources/WLCM.tsv` (one row per prefix, root or suffix) | TAHOT, by Hebrew verse, word number and part position |

- **Text:** taken from Clear's BSB word lists (`targets/BSB/{nt,ot}_BSB.tsv`), so ids line up exactly. This replaces the bible-databases BSB text; about 4% of NT verses differ slightly between printings.
- **Whitespace:** kept as its own token, so `tokens.map(t => t.text).join("")` reproduces Clear's verse.
- **Ids:** a word aligned to several source words carries all of them, eg "not" and "perish" in JHN 3:16 → `["G3361", "G0622"]` / `["PRT-N", "V-2AMS-3S"]`. Hebrew prefixes are included, eg "In the beginning" → `["H9003", "H7225G"]` / `["HR", "HNcfsa"]`.
- **Neither Clear's nor Berean's Strong's numbers are used.** Clear's SBLGNT uses KJV-era form numbers (G2076 ἐστί) and WLCM uses BDB numbers (`0871a`); neither matches STEP dStrongs.

Current coverage: OT 99.5%, NT 99.3% of words tagged. Every morph code is defined in TEGMC/TEHMC.

### Known gaps

- **Psalm titles** — Clear numbers them as verse 0 (eg `PSA.3.0`, 116 verses). The app's BSB has no verse 0, so they are skipped.
- **Verses not in Clear's BSB** — 16 verses omitted from the critical text (eg `MAT.17.21`, `MRK.9.44`) aren't in the output. The uploader leaves their existing verse docs as they are.
- **Hebrew part counts** — when WLCM and TAHOT split a word into a different number of parts (4,995 words), every WLCM part gets TAHOT's root only.
- **dStrongs missing from the extended lexicon** (~1,270 tokens), eg `H0430J`, bare `G2453`. This is the same fallback TODO as Greek.
