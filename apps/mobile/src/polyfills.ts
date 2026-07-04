// Hermes doesn't provide a global `crypto` object. The domain package calls
// `crypto.randomUUID()` for session IDs — see packages/domain/src/stores/bible.store.ts.
// This polyfill is Math.random-based and NOT cryptographically strong; swap in
// expo-crypto's randomUUID if you need real entropy.
const g = globalThis as { crypto?: Crypto };

if (!g.crypto) {
  g.crypto = {} as Crypto;
}

if (typeof g.crypto.randomUUID !== 'function') {
  (g.crypto as { randomUUID: () => `${string}-${string}-${string}-${string}-${string}` }).randomUUID =
    () => {
      const hex = (n: number) =>
        Math.floor(Math.random() * 16 ** n)
          .toString(16)
          .padStart(n, '0');
      const y = ((Math.random() * 4) | 0) + 8;
      return `${hex(8)}-${hex(4)}-4${hex(3)}-${y.toString(16)}${hex(3)}-${hex(12)}` as `${string}-${string}-${string}-${string}-${string}`;
    };
}
