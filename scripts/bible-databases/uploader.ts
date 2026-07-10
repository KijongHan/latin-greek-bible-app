async function uploadBibleData([bible, bibleId]: [string, string]) {
    console.log("Getting bible...");
    const bibleRef = doc(bibleCollection, bibleId);
    const bibleDoc = await getDoc(bibleRef);
    const bibleData = bibleDoc.data();
    if (!bibleData) {
      console.error("Bible not found");
      await setDoc(bibleRef, bibleLookup[bible]);
      return;
    }
  
    const content = await fs.readFile(
      `C:/Users/thoma/Software/bible_databases/formats/json/${bible}.json`,
      "utf-8"
    );
  
    const data: Bible = JSON.parse(content);
    for (const book of data.books) {
      const bookId = bookNameToIdLookup.get(book.name);
      if (!bibleData.books.includes(bookId)) {
        console.log(`Book ${book.name} not found in bible ${bible}`);
        continue;
      }
  
      console.log(`Book ${book.name} found in bible ${bible} - uploading...`);
      const bookData = {
        bibleId: bibleId,
        id: bookId,
        name: book.name,
        chapters: book.chapters.map((chapter) => `${bookId}.${chapter.chapter}`),
        createdAt: new Date(),
      };
      const bookRef = doc(booksCollection, `${bibleId}.${bookId}`);
      await setDoc(bookRef, bookData);
  
      for (const chapter of book.chapters) {
        const chapterId = `${bookId}.${chapter.chapter}`;
        const chapterData = {
          bookId: bookId,
          bibleId: bibleId,
          id: chapterId,
          number: chapter.chapter,
          verses: chapter.verses.map((verse) => ({
            id: `${chapterId}.${verse.verse}`,
            text: verse.text,
          })),
          createdAt: new Date(),
        };
        const chapterRef = doc(chaptersCollection, `${bibleId}.${chapterId}`);
        await setDoc(chapterRef, chapterData);
      }
    }
  }
  
  // main();
  uploadBibleData(['kjv', 'kjv']);