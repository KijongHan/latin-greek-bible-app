import type { UseQueryOptions } from "@tanstack/react-query";
import { SessionStorage } from "./ports";
import { Session } from "./types";

export const sessionsQueryKey = ["sessions"] as const;

// Saved reading sessions, newest first
export const createSessionsQuery = (storage: SessionStorage) => () =>
  ({
    queryKey: sessionsQueryKey,
    queryFn: async () =>
      (await storage.loadAllSessions()).sort(
        (a, b) =>
          new Date(b.sessionDate).getTime() - new Date(a.sessionDate).getTime(),
      ),
    staleTime: Infinity,
  }) satisfies UseQueryOptions<Session[]>;
