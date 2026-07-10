export type Bible = {
    books: Book[];
}

export type Book = {
    name: string;
    chapters: Chapter[];
}

export type Chapter = {
    chapter: number;
    verses: Verse[];
}

export type Verse = {
    verse: number;
    text: string;
}