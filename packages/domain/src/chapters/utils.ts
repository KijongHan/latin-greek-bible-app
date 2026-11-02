export const getChapterId = (bookId: string, chapter: number) => {
  return `${bookId}.${chapter}`;
};

export const getVerseId = (bookId: string, chapter: number, verse: number) => {
  return `${bookId}.${chapter}.${verse}`;
};

export const getChapterRecordKey = (bibleId: string, chapterId: string) => {
  return `${bibleId}.${chapterId}`;
};

export const getVerseRecordKey = (bibleId: string, verseId: string) => {
  return `${bibleId}.${verseId}`;
};
