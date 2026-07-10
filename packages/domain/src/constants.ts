import bookIdList from "@bible-app/data/book-id-list.json";
import bookIdToNameMap from "@bible-app/data/book-id-to-name-map.json";
import bookIdToTestamentMap from "@bible-app/data/book-id-to-testament-map.json";
import bibleIdList from "@bible-app/data/bible-id-list.json";
import { Testament } from "./types";

export const bookIds = bookIdList;
export const bookIdLookup = new Map(
  Object.entries(bookIdToNameMap).map(([id, name]) => [name, id]),
);

export const bookNameLookup = new Map(
  Object.entries(bookIdToNameMap).map(([id, name]) => [id, name]),
);

export const bookTestamentLookup = new Map(
  Object.entries(bookIdToTestamentMap).map(([id, testament]) => [
    id,
    testament as Testament,
  ]),
);

export const bibleIds = bibleIdList;
