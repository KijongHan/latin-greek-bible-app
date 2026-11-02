import type { UseQueryOptions } from "@tanstack/react-query";
import { BibleStorage } from "../bible/ports";
import { Session } from "./types";

export const sessionsQueryKey = ["sessions"] as const;

// Saved reading sessions, newest first. Sessions are only stored locally
// (IndexedDB on web, memory on mobile).
export const createSessionsQuery = (storage: BibleStorage) => () =>
  ({
    queryKey: sessionsQueryKey,
    queryFn: async () =>
      (await storage.loadAllSessions()).sort(
        (a, b) =>
          new Date(b.sessionDate).getTime() - new Date(a.sessionDate).getTime(),
      ),
    staleTime: Infinity,
  }) satisfies UseQueryOptions<Session[]>;
