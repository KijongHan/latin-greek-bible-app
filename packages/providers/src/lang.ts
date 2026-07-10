import { LangProvider } from "@bible-app/domain";
import { iso6393, iso6393To1 } from "iso-639-3";

export const langProvider: LangProvider = {
  convertIso6391ToIso6393: (iso6391: string) => {
    return iso6391To3.get(iso6391) || iso6391;
  },

  displayLanguageName: (iso6393: string) => {
    return iso6393ToLanguageLookup.get(iso6393)?.name || iso6393;
  },
};

const iso6393ToLanguageLookup = new Map(
  iso6393.map((language) => [language.iso6393, language]),
);

const iso6391To3 = new Map(
  Object.entries(iso6393To1).map(([iso6393, iso6391]) => [iso6391, iso6393]),
);
