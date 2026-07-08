import bookIdToNameMap from "@bible-app/data/book-id-to-name-map.json";
import bookIdToTestamentMap from "@bible-app/data/book-id-to-testament-map.json";

export type Testament = 'Old Testament' | 'New Testament' | 'Deuterocanonical';

export const bookIds = Object.keys(bookIdToNameMap);
export const bookNameToIdLookup = new Map(
  Object.entries(bookIdToNameMap).map(([id, name]) => [name, id])
);

export const bookTestamentLookup = new Map(
  Object.entries(bookIdToTestamentMap).map(([id, testament]) => [id, testament as Testament])
);