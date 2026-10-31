import type { UseQueryOptions } from "@tanstack/react-query";
import { Bible } from "../types";
import { BibleQueries } from "./types";

// Root of every bible query key; book, chapter and verse keys nest under
// ["bibles", bibleId], so one bible's data can be invalidated together
export const biblesQueryKey = ["bibles"] as const;

export const createBiblesQuery = (queries: BibleQueries) => () =>
  ({
    queryKey: biblesQueryKey,
    queryFn: () => queries.getBibles(),
    // Bible text only changes on re-upload, so keep it for the session
    staleTime: Infinity,
    gcTime: Infinity,
  }) satisfies UseQueryOptions<Bible[]>;
