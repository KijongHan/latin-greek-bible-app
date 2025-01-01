"use client";
import { CaretRight } from "@phosphor-icons/react";
import { useBibleStore } from "../bible.store";
import SelectComponent from "@/app/shared/components/select.component";
import { useAppStore } from "@/app/app.store";
import { useState } from "react";
import { bookIdLookup, bookTestamentLookup } from "../bible.data";

export default function FrontPage() {
  const { isScrolled } = useAppStore();
  // const [filteredChapters, setFilteredChapters] = useState<string[]>([]);
  const {
    sharedBooks,
    setBook,
    ancientSource,
    englishSource,
    ancientBibles,
    englishBibles,
    setAncientBible,
    setEnglishBible,
  } = useBibleStore();

  return (
    <section className="p-4">
      <h1
        className={`text-6xl font-bold text-center title ${
          isScrolled ? "hidden" : "block"
        }`}
      >
        Bible
      </h1>
      <div className="flex flex-col lg:justify-center gap-2 max-w-5xl mx-auto">
        <div className="flex flex-col">
          <h2
            className={`text-2xl font-bold text-center title ${
              isScrolled ? "hidden" : "block"
            }`}
          >
            {ancientSource?.bible?.name || "Bible"}
          </h2>
          <div className="text-gray-500 text-center">
            {englishSource?.bible?.name ? (
              <div className="flex flex-col flex-shrink">
                <div>
                  <span className="inline">with </span>
                  <span className="font-semibold inline">
                    {englishSource?.bible?.name}
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
          <div className="h-5"></div>
          <div className="flex flex-col landscape-mobile:flex-row landscape-mobile:justify-center lg:flex-row lg:items-center lg:justify-center gap-2 lg:gap-5 landscape-mobile:gap-5">
            <div className="flex flex-col items-start">
              <label className="px-2 text-base text-gray-500">
                Historical Text
              </label>
              <SelectComponent
                className="w-full"
                items={ancientBibles}
                selectedId={ancientSource?.bible?.id}
                idSelector={(bible) => bible.id}
                nameSelector={(bible) => bible.name}
                onSelect={(bible) => {
                  setAncientBible(bible.id);
                }}
              />
            </div>
            <div className="flex flex-col items-start">
              <label className="px-2 text-base text-gray-500">
                English Text
              </label>
              <SelectComponent
                className="w-full"
                selectedId={englishSource?.bible?.id}
                items={englishBibles}
                idSelector={(bible) => bible.id}
                nameSelector={(bible) => bible.name}
                onSelect={(bible) => {
                  setEnglishBible(bible.id);
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
            Books
          </label>
          <div className="grid grid-cols-2 landscape-mobile:grid-cols-3 md:grid-cols-3 gap-2">
            {sharedBooks.map((book) => (
              <button
                key={book}
                onClick={() => {
                  setBook(book);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className={`rounded-full flex flex-row justify-between items-center py-2 px-4 ${
                  bookTestamentLookup.get(book) === "New Testament"
                    ? "bg-red-200"
                    : "bg-sky-300"
                }`}
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
      <footer></footer>
    </section>
  );
}
