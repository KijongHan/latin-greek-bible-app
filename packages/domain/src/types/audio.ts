export interface VerseAudio {
  bibleId: string;
  chapterId: string;
  verseId: string;
  data: Uint8Array;
}

export interface ChapterAudio {
  bibleId: string;
  chapterId: string;
  versesAudio: VerseAudio[];
  chapterRecordKey: string;
}
