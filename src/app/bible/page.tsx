"use client";

import { useBibleStore } from "./bible.store";
import ChapterPage from "./components/chapter.page";
import FrontPage from "./components/front.page";

export default function BiblePage() {
  const { ancientSource, englishSource } = useBibleStore();
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
