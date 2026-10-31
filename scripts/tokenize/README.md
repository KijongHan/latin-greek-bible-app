# Tokenize

Splits verses into one token per word and tags each word with `lexiconEntryIds` (dStrongs from the extended lexicon) and `morphCodeIds` (STEP morph codes). Latin is the exception: it has no Strong's numbers, so its ids are Lewis & Short entries (see [Latin](#latin)). See [`lexicons/README.md`](../lexicons/README.md) for why tokens reference dStrongs, and for sources and licences.

| Folder | Does |
|---|---|
| `greek/` | Tags Greek bibles (Byz, TR) against TAGNT |
| `hebrew/` | Tags Hebrew bibles (WLC) against TAHOT |
| `bsb/` | Builds tagged BSB verses from Clear's word alignments |
| `kjv/` | Builds tagged KJV verses from eBible's Strong's-tagged KJV, matched to TAGNT and TAHOT |
| `latin/` | Tags Latin bibles (VulgClementine) with Lewis & Short entries, via the LatinCy lemmatizer |
| `shared/` | TAGNT and TAHOT parsing, edition selection and word alignment (`parseTagnt`, `parseTahot`, `wordsForEdition`, `tahotWordsByVerse`, `tokenizeVerse`), used by all four |

Each writes to `{folder}/output/`, which is gitignored. Each `uploader.ts` then upserts those verses into the Firestore verses collection.

To upload every tokenized bible at once, or a chosen few, run the root `uploader.ts`. It checks that every output exists before uploading any of them:

```bash
cd scripts
pnpm run upload:tokenized                # Byz, TR, WLC, BSB, KJV, VulgClementine
pnpm run upload:tokenized [Byz TR KJV]
```

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
  - Morph codes are per occurrence, unlike the lexicon entry's `morphRaw`, which describes the lemma. Every code is defined in STEP TEGMC. The code table itself isn't generated yet (TODO in `packages/domain/src/types/bible.ts`).
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

## KJV

`kjv/` builds KJV verses from eBible's Strong's-tagged KJV (`vendor/ebible-kjv`, the USFM files of [eng-kjv2006](https://ebible.org/details.php?id=eng-kjv2006)). Each tagged English word gets the `lexiconEntryIds` and `morphCodeIds` of the Greek or Hebrew word with the same Strong's number in that verse.

```bash
cd scripts
pnpm run generate:tokenized-kjv   # writes kjv/output/KJV.json
pnpm run upload:tokenized-kjv
```

eBible has no git repo, so unlike the other vendor data this isn't a submodule. `vendor/ebible-kjv/` is gitignored. Download it before the first run, or to update it, from the repo root:

```bash
curl -L -o /tmp/kjv.zip https://eBible.org/Scriptures/eng-kjv2006_usfm.zip
unzip -o /tmp/kjv.zip '*.usfm' copr.htm -d vendor/ebible-kjv
```

- **Source words:** TAGNT's `TR` edition for the NT, since the KJV was translated from the TR and TAGNT's TR is Scrivener 1894. TAHOT for the OT.
- **Verse ids:** KJV numbering. TAGNT words are keyed by their `[KJV]` ref where it differs from the NRSV (eg NRSV `Act.2.11` = KJV `ACT.2.10`). TAHOT words are keyed by their English ref, not the Hebrew one.
- **Matching:** a KJV word tagged `S` takes the tags of a source part in the same verse:
  1. numbered `S`
  2. numbered an alias of `S`, or sharing one. The aliases are TBESG/TBESH rows like `G2076 = a Form of G1510` (ἐστί → εἰμί) or `H3212 = a Spelling of H1980I`. They bridge the KJV-era form numbers, eg KJV μου `G3450` and TAGNT `G3165` are both forms of `G1473`.

  The nth `S` in the verse takes the nth match, eg "grace for grace" → `N-ASF`, then `N-GSF`. Only the matching part is used, so "beginning" gets `["H7225G"]`, not the `H9003` prefix as well.
- **Text:** taken from the USFM, so tags line up exactly. The 1769 paragraph marks (¶), footnotes, Psalm titles (`\d`) and Psalm 119's letter headings are dropped. `\add` (italic supplied words), `\nd` (LORD) and `\wj` (words of Jesus) keep their text but lose the styling. This replaces the bible-databases KJV text: same 31,102 verses, and 127 differ in spelling (eg Judea / Judaea).
- **Whitespace:** kept as its own token, so `tokens.map(t => t.text).join("")` reproduces the verse. Punctuation outside a tagged word is its own token.
- **Multi-word tags:** every word in a tagged span gets the tags, eg "the world" → `G2889` on both words.

Current coverage: 99.7% of the KJV's Strong's tags match a source word (10,551 of them through an alias). But the KJV tags only one English word per source word, so 45.6% of English words are tagged. "In the" in Gen 1:1 has no tag.

### Known gaps

- **Untagged words** — function words (the, of, In, …) and Hebrew prefixes have no Strong's number in the KJV, so they stay untagged.
- **KJV tagging errors carry over**, eg "and" in Gen 1:1 is tagged `H0853` (the untranslated object marker אֵת), so it gets אֵת's tags.
- **Unmatched tags** (962, 0.3%) — numbers that differ from STEP's and have no alias, eg `G3440` μόνον, `H2896`/`H2895` טוֹב, and KJV `G1492` for εἶδον, which TAGNT tags as `G3708` ὁράω.
- **Psalm titles** — tagged in the USFM but dropped, because the KJV numbers them outside verse 1.
- **dStrongs missing from the extended lexicon** — the same fallback TODO as Greek.

## Latin

`latin/` tokenizes the Clementine Vulgate verses written by `bible-databases/parser.ts` and tags each word with the [Lewis & Short](../lexicons/README.md#latin) entry for its lemma, or for names, the dStrong of the person or place in STEP's TIPNR. There's no tagged Latin text to match against, as TAGNT and TAHOT are for Greek and Hebrew, so the lemmas come from [LatinCy](https://huggingface.co/latincy/la_core_web_lg), a spaCy pipeline trained on the Universal Dependencies Latin treebanks (including PROIEL, which has the Vulgate NT).

Two files are written to `latin/output/` before tokenizing. `generate-names.ts` writes the TIPNR names list, `names.json`, and `lemmatize.py` runs LatinCy over every verse and writes `{bibleId}.lemmas.json`. The TS tokenizer then splits the verses and looks the lemmas up in the lexicon and the names list:

```bash
cd scripts
pnpm run parse:bibles VulgClementine        # writes bible-databases/output/verses/VulgClementine.json
pnpm run generate:lexicons:latin            # writes lexicons/latin/output/latin-lewis-short.json
pnpm run generate:names-latin               # writes latin/output/names.json
pnpm run lemmatize:latin [VulgClementine]   # writes latin/output/VulgClementine.lemmas.json, ~3 min
pnpm run generate:tokenized-latin [VulgClementine]
pnpm run upload:tokenized-latin [VulgClementine]
```

`lemmatize.py` needs a Python 3.10–3.14 virtualenv (LatinCy's dependencies don't support 3.9, the macOS system Python). Create it once; the model is a ~300 MB download:

```bash
cd scripts/tokenize/latin
python3.14 -m venv .venv
.venv/bin/pip install -r requirements.txt
```

`requirements.txt` pins spaCy and the model version (`la_core_web_lg` 3.9.8), so reruns give the same lemmas. Upgrade them together and compare the outputs.

- **Words:** split on whitespace, as for Greek and Hebrew, so `tokens.map(t => t.text).join("")` reproduces the verse. Punctuation stays attached to its word (`lux.`), and the Clementine's spaced `:` and `;` are their own untagged tokens.
- **Enclitics:** LatinCy splits `-que`, `-ne`, `-ve` and the `-cum` of `mecum`, so those words carry one id per part, eg Dixitque → `["dico2", "que"]`, tecum → `["tu", "cum1"]` (4,355 words).
- **Alignment:** LatinCy respells words before tagging them (cælum → caelum, Jacob → Iacob, Verbum → Uerbum), so its character offsets don't match the source. Its tokens are matched back to the source words by letters instead, after reducing both to lowercase, `æ`/`œ` → `ae`/`oe`, `j` → `i`, `v` → `u` (`normalizeLatin`). All 35,817 verses line up.
- **Context:** each verse is lemmatized on its own. Verses often start mid-sentence, so running per chapter would give LatinCy more context, but the verse boundaries would then have to be recovered from its respelled output.
- **Lexicon ids:** the lemma is matched to an L&S form (any spelling in the entry's `lemma`) with the same normalization. Homographs are ranked by:
  1. matched on the headword rather than an alternative spelling
  2. entry type: `main` / `greek` before `hapax`, `gloss`, `spur`
  3. L&S part of speech agreeing with LatinCy's, eg `cum` as ADP → `cum1` (preposition), as SCONJ → `cum2` (conjunction)
  4. more senses, since the common word has the longer entry, eg `dico2` "say" (33 senses) over `dico1` "dedicate"
- **Names:** see [below](#names).
- **Morph codes:** LatinCy's UD part of speech and features, eg `VERB|Aspect=Perf|Mood=Ind|Number=Sing|Person=3|Tense=Past|VerbForm=Fin|Voice=Act`, or just `CCONJ` for words without features. These aren't STEP codes, so the morph code table TODO needs a Latin section too.

### Names

L&S has few biblical names, so names are tagged with the dStrong of the person or place from STEP's TIPNR (Translators Individualised Proper Names), eg Iacob → `H3290`, Ezechias → `H2396G` in Kings and `G1478` in Matthew. That's the same id the Greek and Hebrew tokens carry, so a Latin name links to its entry in the extended lexicon. Latin tokens therefore hold two kinds of id: L&S keys for words, dStrongs for names.

`generate-names.ts` parses TIPNR into `names.json`, one record per dStrong (`ProperName` in `shared/parser.ts`):

```json
{ "dStrong": "G1478", "uStrong": "H2396G", "names": ["Hezekiah", "Ezekias", "Ἐζεκίας"], "refs": ["MAT.1.9", "MAT.1.10"] }
```

- `names` are the ESV / KJV / NIV renderings plus the Hebrew or Greek form. Lowercase renderings (eg "he" for Jacob) are dropped.
- `refs` are every verse the form occurs in, in English versification, with TIPNR's `a`/`b` suffixes and `LXX.` prefixes removed.
- `uStrong` is shared by every form of one person. TIPNR counts Jacob and Israel as one person (`H3478`).
- TIPNR's "– Total" lines repeat the other lines with abbreviated refs, so they're skipped.

Latin spellings of names are often far from the English (Ionathas / Jonathan, Holdam / Huldah, Achimelech / Ahimelech). But TIPNR lists every verse a name occurs in, so each Latin name is first compared only with the few names in its own verse. Spellings are compared by a sound-alike key (`soundKey` in `names.ts`):
- Greek forms are transliterated the way Latin borrows them (Ἰουδαῖος → iudaeus).
- `ch`, `h` and `k` all become `c`, since the Vulgate writes ח and כ as `ch` or `h` (Achab / Ahab, Chanaan / Canaan).
- English final `-h` is dropped (Judah / Juda), and doubled letters are collapsed.
- Gentilic endings are stripped, so Amorrhaeus matches Amorite.

Each word is resolved in this order:
1. **Exact name:** for words LatinCy tags PROPN, a name in the verse with the same key. Failing that, any TIPNR name with the same key, taking the most-named person. Then from that person's forms, the one used in the same book, in the same testament (Moyses in Exodus → Hebrew `H4872`, not Greek `G3475`), with the matching spelling (Iacob stays Jacob, not Israel). A match from the other testament is rejected, eg Semei in Ezra isn't Luke's Semein (`G4584`). Deuterocanonical books accept either.
2. **L&S**, as above.
3. **Exact name** again, for words that aren't PROPN.
4. **Similar name in the verse**, scoring at least 0.6 (1 − edit distance / length), unless two different people tie.
5. **Similar name in the chapter**, for capitalized words of four or more letters scoring at least 0.75. This catches names whose verse number differs from the English (Vulgate Gen 25:25 is English 25:26).

A near spelling only counts after L&S, so ordinary words LatinCy mistags as names (Dominus, Deus) keep their L&S entry.

Current coverage: 98.8% of words tagged, 30,569 of them as TIPNR names.

### Known gaps

- **Untagged names.** 3,349 words LatinCy tags as names stay untagged, from two causes:
  - Names TIPNR doesn't have or can't place in the verse: mostly the deuterocanonical books, which TIPNR barely covers (Tobias, Holofernes, Ionathas in 1 Maccabees, Mardochaeus in the Greek additions to Esther), and gentilic plurals where the Vulgate verse differs from the English (Iudaei).
  - Ordinary words LatinCy mistags as names: capitalized verbs and adjectives at the start of a sentence, eg Benedictus, Altissimus, Salutate. LatinCy leaves them unlemmatized, so neither L&S nor TIPNR matches them.
- **Psalms** use Vulgate numbering (Vulgate Ps 22 is English Ps 23), so names there seldom match in their own verse. 78% of words LatinCy tags as names are tagged in the Psalms, against 91% elsewhere.
- **Late and ecclesiastical words** missing from L&S, eg `semetipse`, `gazophylacium`, `usquequo`.
- **Lemmatizer errors and spelling variants**, eg `coepi` (L&S has it under `coepio`), `uidua` (under `viduus`), `uanito` for vanitas, `caeremonia` (L&S `caerimonia`).
- **Wrong homographs** where L&S part of speech is missing or both entries share it. The sense-count tiebreak picks the common word, which is usually but not always right.
- **A part that fails to resolve** is dropped from both arrays, so a two-part word can carry a single id.

