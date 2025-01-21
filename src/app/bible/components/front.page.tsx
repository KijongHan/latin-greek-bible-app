"use client";
import { CaretRight } from "@phosphor-icons/react";
import { useBibleStore } from "../bible.store";
import SelectComponent from "@/app/shared/components/select.component";
import {
  bookIdLookup,
  booksWithAudio,
  bookTestamentLookup,
} from "../bible.data";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BiblePreset } from "../bible.model";

const getDateAgo = (dateString: string) => {
  const now = new Date();
  const date = new Date(dateString);
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "today";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 365) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} ${weeks === 1 ? "week" : "weeks"} ago`;
  }
  const years = Math.floor(diffDays / 365);
  return `${years} ${years === 1 ? "year" : "years"} ago`;
};

const getBookColor = (book: string) => {
  return bookTestamentLookup.get(book) === "New Testament"
    ? "bg-red-200"
    : bookTestamentLookup.get(book) === "Old Testament"
    ? "bg-sky-300"
    : bookTestamentLookup.get(book) === "Deuterocanonical"
    ? "bg-violet-300"
    : "bg-gray-300";
};

export default function FrontPage() {
  const router = useRouter();
  const [preset, setPreset] = useState<BiblePreset | undefined>(undefined);
  const {
    sharedBooks,
    presets,
    mainSource,
    glossSource,
    bibles,
    setBook,
    setChapter,
    setMainBible,
    setGlossBible,
    lastSessions,
  } = useBibleStore();

  useEffect(() => {
    setPreset(
      presets.find(
        (preset) =>
          preset.mainBibleId === mainSource?.bible?.id &&
          preset.glossBibleId === glossSource?.bible?.id
      )
    );
  }, [mainSource, glossSource]);

  return (
    <section className="p-4">
      <div className="flex flex-col lg:justify-center gap-2 max-w-5xl mx-auto">
        <div className="flex flex-col">
          <div className="flex flex-col sm:flex-row sm:mx-auto sm:gap-4 sm:mt-5 items-center">
            <h1 className={`text-6xl font-bold text-center title`}>Bible</h1>
            <div>
              <h2 className={`text-2xl font-bold text-center title`}>
                {mainSource?.bible?.name || "Bible"}
              </h2>
              <div className="text-gray-500 text-center">
                {glossSource?.bible?.name ? (
                  <div className="flex flex-col flex-shrink">
                    <div>
                      <span className="inline">with </span>
                      <span className="font-semibold inline">
                        {glossSource?.bible?.name}
                      </span>{" "}
                    </div>
                    {/* <div className="mt-2 flex-wrap">
                  and literal Latin - English translations by William A.
                  Whitaker and the WORDS project
                </div> */}
                  </div>
                ) : (
                  <span></span>
                )}
              </div>
            </div>
          </div>

          {lastSessions.length > 0 && <div className="h-5"></div>}
          {lastSessions.length > 0 && (
            <div className="flex flex-col items-start w-full md:w-1/2 mx-auto">
              <label className="px-2 text-base text-gray-500">
                Continue Last Session
              </label>
              <div className="w-full">
                {lastSessions
                  .sort(
                    (a, b) =>
                      new Date(b.sessionDate).getTime() -
                      new Date(a.sessionDate).getTime()
                  )
                  .map((session) => {
                    const lastVisit = session.visits.at(-1);
                    return {
                      sessionId: session.sessionId,
                      sessionDate: session.sessionDate,
                      lastVisit,
                    };
                  })
                  .map((session) => (
                    <button
                      key={session.sessionId}
                      onClick={async () => {
                        await setBook(session.lastVisit?.main.bookId ?? "");
                        await setChapter(
                          session.lastVisit?.main.chapterId ?? ""
                        );
                      }}
                      className={`rounded-full flex w-full flex-row justify-between items-center py-2 px-4 pl-10 ${getBookColor(
                        session.lastVisit?.main.bookId ?? ""
                      )}`}
                    >
                      <div className="flex flex-col">
                        <div className="flex flex-row">
                          {bookIdLookup.get(
                            session.lastVisit?.main.bookId ?? ""
                          )}{" "}
                          {session.lastVisit?.main.chapterId.split(".")[1]}
                        </div>
                        <div className="text-left text-gray-600 text-sm">
                          {getDateAgo(session.sessionDate)}
                        </div>
                      </div>
                      <div className="flex flex-row gap-2 portrait-mobile:flex-col portrait-mobile:gap-0 text-center justify-center items-center text-gray-500 text-sm">
                        <div>{session.lastVisit?.main.bibleName}</div>
                        <div className="portrait-mobile:hidden">{" - "}</div>
                        <div>{session.lastVisit?.gloss.bibleName}</div>
                      </div>
                      <CaretRight />
                    </button>
                  ))}
              </div>
            </div>
          )}
          <div className="h-5"></div>
          <div className="flex flex-col items-start w-full md:w-1/2 mx-auto">
            <label className="px-2 text-base text-gray-500">
              Main/Gloss Presets
            </label>
            <SelectComponent
              className="w-full"
              items={presets}
              selectedId={preset?.name ?? "Custom"}
              idSelector={(preset) => preset.name}
              nameSelector={(preset) => preset.name}
              hideId="Custom"
              onSelect={(preset) => {
                if (preset.name !== "Custom") {
                  setMainBible(preset.mainBibleId);
                  setGlossBible(preset.glossBibleId);
                }
              }}
            />
          </div>
          <div className="h-2 md:h-5 landscape-mobile:h-5"></div>
          <div className="flex flex-col landscape-mobile:flex-row landscape-mobile:justify-center md:flex-row md:items-center md:justify-center gap-2 md:gap-5 landscape-mobile:gap-5">
            <div className="flex flex-col items-start">
              <label className="px-2 text-base text-gray-500">Main Text</label>
              <SelectComponent
                className="w-full"
                items={bibles}
                selectedId={mainSource?.bible?.id}
                idSelector={(bible) => bible.id}
                nameSelector={(bible) => bible.name}
                onSelect={(bible) => {
                  setMainBible(bible.id);
                }}
              />
            </div>
            <div className="flex flex-col items-start">
              <label className="px-2 text-base text-gray-500">Gloss Text</label>
              <SelectComponent
                className="w-full"
                selectedId={glossSource?.bible?.id}
                items={bibles}
                idSelector={(bible) => bible.id}
                nameSelector={(bible) => bible.name}
                onSelect={(bible) => {
                  setGlossBible(bible.id);
                }}
              />
            </div>
          </div>
          {/* <div className="h-5"></div>
          <div className="flex flex-col landscape-mobile:w-3/4 landscape-mobile:self-center lg:w-1/2 lg:self-center">
            <label className="px-2 text-base text-gray-500">Chapters</label>
            <SearchInput
              className="w-full"
              isLoading={isLoadingSharedChapters ?? false}
              placeholder={
                isLoadingSharedChapters
                  ? "Loading chapters data..."
                  : "Search for chapters..."
              }
              onSearch={handleChapterSearch}
            />
            <div className="flex flex-col gap-2"></div>
          </div> */}
        </div>
        <div className="h-5"></div>
        <div className="flex flex-col">
          <label className="px-2 text-base text-gray-500 lg:px-[26%]">
            Audio Books
          </label>
          <div className="grid grid-cols-2 landscape-mobile:grid-cols-3 md:grid-cols-3 gap-2">
            {sharedBooks
              .filter((book) => booksWithAudio.includes(book))
              .map((book) => (
                <button
                  key={book}
                  onClick={() => {
                    router.push(`/bible?book=${book}`);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className={`rounded-full flex flex-row justify-between items-center py-2 px-4 ${getBookColor(
                    book
                  )}`}
                >
                  <div className="text-left text-gray-600 text-sm">
                    {bookIdLookup.get(book)}
                  </div>
                  <CaretRight />
                </button>
              ))}
          </div>
        </div>
        <div className="h-5"></div>
        <div className="flex flex-col">
          <label className="px-2 text-base text-gray-500 lg:px-[26%]">
            Books
          </label>
          <div className="grid grid-cols-2 landscape-mobile:grid-cols-3 md:grid-cols-3 gap-2">
            {sharedBooks.map((book) => (
              <button
                key={book}
                onClick={() => {
                  router.push(`/bible?book=${book}`);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className={`rounded-full flex flex-row justify-between items-center py-2 px-4 ${getBookColor(
                  book
                )}`}
              >
                <div className="text-left text-gray-600 text-sm">
                  {bookIdLookup.get(book)}
                </div>
                <CaretRight />
              </button>
            ))}
          </div>
        </div>
      </div>
      {/* <div className="h-5"></div>
      <section className="prose max-w-3xl mx-auto">
        <h2 className="text-lg text-center text-gray-500 title">
          {mainSource?.bible?.name || "Bible"}
        </h2>
        <div
          dangerouslySetInnerHTML={{
            __html: mainSource?.bible?.description ?? "",
          }}
        ></div>
      </section> */}
      <div className="h-5"></div>
      <footer className="max-w-3xl mx-auto">
        <h2 className="text-lg text-center text-gray-500">
          About This Project
        </h2>
        <p>
          This project is a work in progress. The focus is on the study of
          ancient Latin, Greek, Hebrew and Aramaic texts and making them easily
          accessible alongside contemporary english translations.
        </p>
        <br />
        <p>
          Bible uses free and open source data for bible texts and translations.
          The data is sourced from the awesome work done by the Github community
          in the{" "}
          <a
            className="underline text-blue-600 hover:text-blue-800"
            href="https://github.com/scrollmapper/bible_databases"
          >
            Open Source Bible Databases
          </a>{" "}
          project
        </p>
        <br />
        <p>
          Audio is generated by TTS (Text To Speech) from OpenAI{"'"}s{" "}
          <a
            className="underline text-blue-600 hover:text-blue-800"
            href="https://openai.com/"
          >
            Whisper
          </a>{" "}
          which is a general-purpose speech recognition model
        </p>
        <div className="h-5"></div>
        <h2 className="text-lg text-center text-gray-500">Contact</h2>
        <p>
          If you have any questions or feedback, please contact me at{" "}
          <a
            className="underline text-blue-600 hover:text-blue-800"
            href="mailto:thomas.kijong.han@gmail.com"
          >
            thomas.kijong.han@gmail.com
          </a>
        </p>
      </footer>
    </section>
  );
}
