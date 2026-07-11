export const getBookRecordKey = (bibleId: string, book: string) => {
  return `${bibleId}.${book}`;
};

export const getChapterRecordKey = (bibleId: string, chapterId: string) => {
  return `${bibleId}.${chapterId}`;
};
