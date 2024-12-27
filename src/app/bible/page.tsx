"use client";

import { useEffect } from "react";
import { useBibleStore } from "./bible.store";
import { CaretDown } from "@phosphor-icons/react";
import ChapterPage from "./components/chapter.page";
import FrontPage from "./components/front.page";

export default function BiblePage() {
  const { ancientSource, englishSource, ancientBibles, englishBibles } =
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
