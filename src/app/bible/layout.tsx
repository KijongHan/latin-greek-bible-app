"use client";
import { useEffect, useState } from "react";
import { useBibleStore } from "./bible.store";
import { House } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import SelectComponent from "../shared/components/select.component";
import LeftCircleButton from "../shared/components/left.circlebutton";
import RightCircleButton from "../shared/components/right.circlebutton";
import { useAppStore } from "../app.store";
import LoadingSpinner from "../shared/components/loading.spinner";
import CircleButton from "../shared/components/circlebutton";

export default function BibleLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [showLoading, setShowLoading] = useState(true);
  const [showPreviousChapter, setShowPreviousChapter] = useState(false);
  const [showNextChapter, setShowNextChapter] = useState(false);
  const { isScrolled, setIsScrolled } = useAppStore();
  const {
    clear,
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
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePreviousChapter = async () => {
    await previousChapter();
    window.scrollTo({ top: 0, behavior: "smooth" });
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

                <div className="flex flex-row items-center gap-4">
                  <h1
                    className={`font-semibold flex items-center gap-2 transition-all text-gray-600 landscape-mobile:text-sm portrait-mobile:hidden text-lg ${
                      isScrolled ? "visible" : "invisible"
                    }`}
                  >
                    {ancientSource?.book?.name} {ancientSource?.chapter?.number}
                  </h1>
                  {!isScrolled ? (
                    <CircleButton
                      onClick={() => {
                        clear();
                      }}
                      icon={<House size={16} />}
                    />
                  ) : (
                    <CircleButton
                      onClick={() => {
                        clear();
                      }}
                      icon={<House size={16} />}
                    />
                  )}
                </div>
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
      <LeftCircleButton
        className={`fixed top-[calc(50%+8px)] left-2 ${
          showPreviousChapter ? "block" : "invisible"
        } bg-white`}
        onClick={handlePreviousChapter}
      />
      <RightCircleButton
        className={`fixed top-[calc(50%+8px)] right-2 ${
          showNextChapter ? "block" : "invisible"
        } bg-white`}
        onClick={handleNextChapter}
      />
      {showLoading && (
        <div
          className={`fixed inset-0 bg-white ${
            ancientSource ? "bg-opacity-50" : ""
          } flex flex-col items-center justify-center`}
        >
          <LoadingSpinner size={32} className="mt-16" />
          {!ancientSource && (
            <p className="text-gray-500 text-sm">Initializing bible data...</p>
          )}
        </div>
      )}
    </section>
  );
}
