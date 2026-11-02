export type Testament = "Old Testament" | "New Testament" | "Deuterocanonical";

export interface Book {
  id: string;
  bibleId: string;
  name: string;
  chapters: string[];
  bookRecordKey: string;
}
