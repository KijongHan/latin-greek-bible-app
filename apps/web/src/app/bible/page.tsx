"use client";

import { useBibleSources } from "@bible-app/domain";
import ChapterPage from "./components/chapter.page";
import FrontPage from "./components/front.page";

export default function BiblePage() {
  const { mainSource: ancientSource, glossSource: englishSource } =
    useBibleSources();
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
