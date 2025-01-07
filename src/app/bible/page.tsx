"use client";

import { useBibleStore } from "./bible.store";
import ChapterPage from "./components/chapter.page";
import FrontPage from "./components/front.page";

export default function BiblePage() {
  const { mainSource: ancientSource, glossSource: englishSource } =
    useBibleStore();
  return (
    <>
      {ancientSource?.chapter && englishSource?.chapter ? (
        <ChapterPage />
      ) : (
        <FrontPage />
      )}
    </>
  );
}
