export interface UuidProvider {
  generateUuid(): string;
}

export interface LangProvider {
  convertIso6391ToIso6393(iso6391: string): string;
  displayLanguageName(iso6393: string): string;
}
