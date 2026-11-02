export interface Session {
  sessionId: string;
  sessionDate: string;
  visits: {
    main: {
      bibleId: string;
      bibleName: string;
      bookId: string;
      chapterId: string;
    };
    gloss: {
      bibleId: string;
      bibleName: string;
      bookId: string;
      chapterId: string;
    };
    visitedAt: string;
  }[];
}
