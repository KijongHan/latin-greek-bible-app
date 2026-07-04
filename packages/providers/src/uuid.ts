import { UuidProvider } from "@bible-app/domain";

export const cryptoUuidProvider: UuidProvider = {
  generateUuid: () => {
    return crypto.randomUUID();
  },
};

export const simpleUuidProvider: UuidProvider = {
  generateUuid: () => {
    return Date.now().toString(36)
  },
};