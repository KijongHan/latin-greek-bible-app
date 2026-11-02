import type { Session, SessionStorage } from "@bible-app/domain";
import { indexedDBRepository, SESSIONS_STORE } from "./indexeddb.repository";

export const indexedDbSessionStorage: SessionStorage = {
  saveSession: (session) =>
    indexedDBRepository.update<Session>(session, SESSIONS_STORE),
  loadAllSessions: () => indexedDBRepository.loadAll<Session>(SESSIONS_STORE),
};
