import { Session } from "./types";

// Reading sessions are only stored on the device (IndexedDB on web, memory
// on mobile)
export interface SessionStorage {
  saveSession(session: Session): Promise<void>;
  loadAllSessions(): Promise<Session[]>;
}
