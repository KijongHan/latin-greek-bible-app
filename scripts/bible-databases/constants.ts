import bibleIdToNameMap from "./bible-id-to-name-map.json";
import bibleIdToDescriptionMap from "./bible-id-to-description-map.json";
import bibleIdToLanguageMap from "./bible-id-to-language-map.json";
import bibleIdToDateMap from "./bible-id-to-date-map.json";

export const bibleNameLookup = new Map(
    Object.entries(bibleIdToNameMap).map(([id, name]) => [id, name])
);

export const bibleDescriptionsLookup = new Map(
    Object.entries(bibleIdToDescriptionMap).map(([id, description]) => [id, description])
);

export const bibleLanguagesLookup = new Map(
    Object.entries(bibleIdToLanguageMap).map(([id, language]) => [id, language])
);

export const bibleDateLookup = new Map(
    Object.entries(bibleIdToDateMap).map(([id, date]) => [id, date])
);