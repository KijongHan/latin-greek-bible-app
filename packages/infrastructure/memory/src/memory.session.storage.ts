import type { Session, SessionStorage } from "@bible-app/domain";

export const createMemorySessionStorage = (): SessionStorage => {
  const sessions = new Map<string, Session>();

  return {
    saveSession: async (session) => {
      sessions.set(session.sessionId, session);
    },
    loadAllSessions: async () => [...sessions.values()],
  };
};
