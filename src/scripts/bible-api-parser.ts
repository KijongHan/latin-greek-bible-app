import { initializeApp } from "firebase/app";
import {
  addDoc,
  collection,
  doc,
  getFirestore,
  setDoc,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAINhGcCv_D-meQhYryEEsm5qLmRMApfX0",
  authDomain: "bible-app-4ea8f.firebaseapp.com",
  projectId: "bible-app-4ea8f",
  storageBucket: "bible-app-4ea8f.firebasestorage.app",
  messagingSenderId: "1052050185148",
  appId: "1:1052050185148:web:93778e8f126d9e85a329b9",
  measurementId: "G-3FD1WCMH6P",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function main() {
  const myHeaders = new Headers();
  myHeaders.append("api-key", "05240605bba389df04eea6a05dc8335d");

  const [textusReceptus, americanStandardVersion, ancientHebrew, kjv] = [
    "3aefb10641485092-01",
    "06125adad2d5898a-01",
    "0b262f1ed7f084a6-01",
    "de4e12af7f28f599-02",
  ];
  const bibleId = kjv;
  const bible: { data: {} } = await fetch(
    `https://api.scripture.api.bible/v1/bibles/${bibleId}`,
    {
      method: "GET",
      headers: myHeaders,
      redirect: "follow",
    }
  )
    .then((response) => response.json())
    .catch((error) => console.error(error));
  const books: {
    data: {
      id: string;
      bibleId: string;
      abbreviation: string;
      name: string;
      nameLong: string;
    }[];
  } = await fetch(
    `https://api.scripture.api.bible/v1/bibles/${bibleId}/books`,
    {
      method: "GET",
      headers: myHeaders,
      redirect: "follow",
    }
  )
    .then((response) => response.json())
    .catch((error) => console.error(error));

  const bibleCollection = collection(db, "bibles");
  const booksCollection = collection(db, "books");
  const chaptersCollection = collection(db, "chapters");

  const bibleRef = doc(bibleCollection, `${bibleId}`);
  await setDoc(bibleRef, {
    ...bible.data,
    books: books.data.map((book) => book.id),
    createdAt: new Date(),
  });
  for (const book of books.data) {
    const chapters: {
      data: {
        id: string;
        bibleId: string;
        bookId: string;
        number: string;
        reference: string;
      }[];
    } = await fetch(
      `https://api.scripture.api.bible/v1/bibles/${bibleId}/books/${book.id}/chapters`,
      {
        method: "GET",
        headers: myHeaders,
        redirect: "follow",
      }
    )
      .then((response) => response.json())
      .catch((error) => console.error(error));
    console.log(chapters.data);

    const bookRef = doc(booksCollection, `${book.bibleId}.${book.id}`);
    await setDoc(bookRef, {
      ...book,
      chapters: chapters.data.map((chapter) => chapter.id),
      createdAt: new Date(),
    });

    for (const chapter of chapters.data) {
      //   if (chapter.id === "JDG.5") continue;
      //   if (chapter.id === "JOB.3") continue;
      const passage: {
        data: {
          content: {
            name: "para";
            items: {
              type: "tag" | "text";
              attrs: {
                verseId: string;
              };
              name?: "verse" | "char";
              text?: string;
              items?: {
                type: "tag" | "text";
                attrs: {
                  verseId: string;
                };
                text?: string;
              }[];
            }[];
          }[];
        };
      } = await fetch(
        `https://api.scripture.api.bible/v1/bibles/${bibleId}/passages/${chapter.id}?content-type=json`,
        {
          method: "GET",
          headers: myHeaders,
          redirect: "follow",
        }
      )
        .then((response) => response.json())
        .catch((error) => console.error(error));
      const passageHtml: {
        data: {
          content: string;
        };
      } = await fetch(
        `https://api.scripture.api.bible/v1/bibles/${bibleId}/passages/${chapter.id}?content-type=html&include-titles=true`,
        {
          method: "GET",
          headers: myHeaders,
          redirect: "follow",
        }
      )
        .then((response) => response.json())
        .catch((error) => console.error(error));

      if (!passage?.data?.content) {
        console.error(`missing content for ${chapter.id}`);
        continue;
      }
      const verses = passage.data.content
        .flatMap((p) => p.items)
        .map((i) =>
          i.type === "text"
            ? {
                text: i.text || "",
                verseId: i.attrs?.verseId ?? "",
              }
            : i.name === "char"
            ? {
                text: i.items?.filter((i) => i.type === "text")[0]?.text ?? "",
                verseId:
                  i.items?.filter((i) => i.type === "text")[0].attrs?.verseId ??
                  "",
              }
            : null
        )
        .filter((i) => i != null)
        .reduce((acc, verse) => {
          if (verse.verseId === undefined || verse.text === undefined) {
            throw new Error("verseId or text is undefined");
          }
          if (!acc[verse.verseId]) {
            acc[verse.verseId] = verse;
          } else {
            acc[verse.verseId].text += ` ${verse.text}`;
          }
          return acc;
        }, {} as Record<string, { text?: string; verseId?: string }>);
      const versesArray = Object.values(verses);
      const sections = [
        ...new Set(
          passage.data.content
            .map((p) => {
              const verses = p.items
                .filter((i) => i.attrs?.verseId !== undefined)
                .map((i) => i.attrs?.verseId);
              return {
                startVerseId: verses[0],
                endVerseId: verses[verses.length - 1],
              };
            })
            .filter(
              (s) => s.startVerseId !== undefined && s.endVerseId !== undefined
            )
        ),
      ];

      console.log(versesArray);
      console.log(sections);
      const chapterRef = doc(chaptersCollection, `${bibleId}.${chapter.id}`);
      await setDoc(chapterRef, {
        ...chapter,
        html: passageHtml.data.content,
        verses: versesArray,
        sections: sections,
        createdAt: new Date(),
      });
    }
  }

  //   for (const book of books.data) {
  //     const chapters = await fetch(
  //       `https://api.scripture.api.bible/v1/bibles/${americanStandardVersion}/books/${book.id}/chapters`,
  //       {
  //         method: "GET",
  //         headers: myHeaders,
  //         redirect: "follow",
  //       }
  //     );
  //   }
}

main();
