"use client";
import { useEffect, useState } from "react";
import { useBibleStore } from "./bible.store";
import { Cube, CaretRight, CaretLeft, BookOpen } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import SelectComponent from "../shared/components/select.component";
import LeftCircleButton from "../shared/components/left.circlebutton";
import RightCircleButton from "../shared/components/right.circlebutton";
import { useAppStore } from "../app.store";
import LoadingSpinner from "../shared/components/loading.spinner";

export default function BibleLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [showLoading, setShowLoading] = useState(false);
  const [showPreviousChapter, setShowPreviousChapter] = useState(false);
  const [showNextChapter, setShowNextChapter] = useState(false);
  const { isScrolled, setIsScrolled } = useAppStore();
  const {
    isLoading,
    sharedBooks,
    ancientSource,
    englishSource,
    initialize,
    nextChapter,
    previousChapter,
    setChapter,
    setBook,
  } = useBibleStore();

  useEffect(() => {
    initialize();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!isLoading) {
      setShowLoading(false);
      return;
    }

    const timeoutId = setTimeout(() => {
      setShowLoading(true);
    }, 250);
    return () => clearTimeout(timeoutId);
  }, [isLoading]);

  useEffect(() => {
    if (ancientSource?.book && ancientSource?.chapter) {
      setShowPreviousChapter(true);
      setShowNextChapter(true);
    } else {
      setShowPreviousChapter(false);
      setShowNextChapter(true);
    }
  }, [ancientSource, englishSource]);

  const handleNextChapter = async () => {
    await nextChapter();
  };

  const handlePreviousChapter = async () => {
    await previousChapter();
  };

  return (
    <section>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled ? "bg-white shadow-md py-2" : "bg-transparent py-4"
        }`}
      >
        {
          ancientSource?.book && ancientSource?.chapter ? (
            <div className="container mx-auto px-4">
              <nav className="flex items-center justify-between">
                <div className="flex gap-2">
                  <SelectComponent
                    items={sharedBooks ?? []}
                    selectedId={ancientSource?.book?.id}
                    idSelector={(book) => book}
                    nameSelector={(book) => book}
                    onSelect={(book) => {
                      setBook(book);
                    }}
                  />
                  <SelectComponent
                    items={ancientSource?.book?.chapters ?? []}
                    selectedId={ancientSource?.chapter?.id}
                    idSelector={(chapter) => chapter}
                    nameSelector={(chapter) => chapter.split(".")[1]}
                    onSelect={(chapter) => {
                      setChapter(chapter);
                    }}
                  />
                </div>

                <h1
                  className={`font-semibold flex items-center gap-2 transition-all text-gray-600 portrait-mobile:hidden text-lg ${
                    isScrolled ? "visible" : "invisible"
                  }`}
                >
                  {ancientSource?.book?.name} {ancientSource?.chapter?.number}
                </h1>
              </nav>
            </div>
          ) : (
            <div></div>
          )
          // (
          //   <div className="container mx-auto px-4 flex flex-row justify-between">
          //     <button className="rounded-full shadow-md p-6 text-sm flex items-center justify-center gap-2 h-14">
          //       <p>Old Testament</p>
          //       <CaretRight size={16} />
          //     </button>
          //     <button className="rounded-full shadow-md p-6 text-sm flex items-center justify-center gap-2 h-14">
          //       <p>New Testament</p>
          //       <CaretRight size={16} />
          //     </button>
          //   </div>
          // )
        }
      </header>

      <main>{children}</main>
      <div className="fixed top-[calc(50%+8px)] left-2 right-2 flex justify-between">
        <LeftCircleButton
          className={`${showPreviousChapter ? "block" : "invisible"} bg-white`}
          onClick={handlePreviousChapter}
        />
        <RightCircleButton
          className={`${showNextChapter ? "block" : "invisible"} bg-white`}
          onClick={handleNextChapter}
        />
      </div>
      {showLoading && (
        <div className="fixed inset-0 bg-white bg-opacity-50 flex items-center justify-center">
          <LoadingSpinner size={32} className="mt-16" />
        </div>
      )}
    </section>
  );
}
