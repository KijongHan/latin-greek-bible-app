"use client";
import { CaretDown, CaretRight, MagnifyingGlass } from "@phosphor-icons/react";
import { useBibleStore } from "../bible.store";
import SelectComponent from "@/app/shared/components/select.component";
import { useAppStore } from "@/app/app.store";
import SearchInput from "@/app/shared/components/search.input";
import { useState } from "react";
import {
  bookGroupLookup,
  bookGroups,
  bookIdLookup,
  bookTestamentLookup,
} from "../bible.data";

export default function FrontPage() {
  const { isScrolled } = useAppStore();
  const [filteredChapters, setFilteredChapters] = useState<string[]>([]);
  const {
    sharedBooks,
    sharedChapters,
    setBook,
    isLoadingSharedChapters,
    ancientSource,
    englishSource,
    ancientBibles,
    englishBibles,
    setAncientBible,
    setEnglishBible,
  } = useBibleStore();

  const handleChapterSearch = (searchTerm: string) => {
    throw new Error("Function not implemented.");
  };

  return (
    <section className="p-4">
      <h1
        className={`text-6xl font-bold text-center title ${
          isScrolled ? "hidden" : "block"
        }`}
      >
        Bible
      </h1>
      <div className="flex flex-col md:justify-center md:flex-row landscape-mobile:justify-around landscape-mobile:flex-row gap-2">
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
          <div className="flex flex-col md:flex-row md:items-center md:justify-center gap-2">
            <div className="flex flex-col items-start">
              <label className="px-2 text-base text-gray-500">
                Ancient Text
              </label>
              <SelectComponent
                className="w-full"
                items={ancientBibles}
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
          <div className="h-5"></div>
          <div className="flex flex-col">
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
          </div>
        </div>
        <div className="h-5"></div>
        <div className="flex flex-col">
          <label className="px-2 text-base text-gray-500">Books</label>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 landscape-mobile:grid-cols-1 landscape-mobile:overflow-y-scroll landscape-mobile:h-[calc(100vh)] landscape-mobile:gap-4 md:h-[calc(100vh)] md:overflow-y-scroll">
            {sharedBooks.map((book) => (
              <button
                key={book}
                onClick={() => {
                  setBook(book);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className={`rounded-full flex flex-row justify-between items-center py-1 px-4 ${
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
