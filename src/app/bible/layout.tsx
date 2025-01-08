"use client";
import { useEffect, useState } from "react";
import { useBibleStore } from "./bible.store";
import { Article, Headphones, House, Rows } from "@phosphor-icons/react";
import SelectComponent from "../shared/components/select.component";
import LeftCircleButton from "../shared/components/left.circlebutton";
import RightCircleButton from "../shared/components/right.circlebutton";
import { useAppStore } from "../app.store";
import LoadingSpinner from "../shared/components/loading.spinner";
import CircleButton from "../shared/components/circlebutton";
import ChapterAudio from "./components/chapter.audio";
import { useBibleAudioStore } from "./bibleaudio.store";
import { booksWithAudio } from "./bible.data";
import CircleContainer from "../shared/components/circle.container";

export default function BibleLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [showLoading, setShowLoading] = useState(true);
  const [showPreviousChapter, setShowPreviousChapter] = useState(false);
  const [showNextChapter, setShowNextChapter] = useState(false);
  const [showAudioButton, setShowAudioButton] = useState(false);
  const { isScrolled, setIsScrolled } = useAppStore();
  const {
    isLoading: isLoadingAudio,
    isAudioEnabled,
    setIsAudioEnabled,
    isAudioPlaying,
  } = useBibleAudioStore();
  const {
    clear,
    showGlossText,
    isLoading,
    sharedBooks,
    mainSource,
    glossSource,
    initialize,
    nextChapter,
    previousChapter,
    setChapter,
    setBook,
    setShowGlossText,
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
    if (mainSource?.book && mainSource?.chapter) {
      setShowPreviousChapter(true);
      setShowNextChapter(true);
    } else {
      setShowPreviousChapter(false);
      setShowNextChapter(true);
    }
  }, [mainSource, glossSource]);

  useEffect(() => {
    if (mainSource?.book && mainSource?.chapter) {
      setShowAudioButton(booksWithAudio.includes(mainSource?.book?.id));
    }
  }, [mainSource]);

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
      {mainSource?.book && mainSource?.chapter && (
        <header
          className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
            isScrolled ? "bg-white shadow-md py-2" : "bg-transparent py-4"
          }`}
        >
          <div className="container mx-auto px-4">
            <nav className="flex items-center justify-between portrait-mobile-sm:flex-col portrait-mobile-sm:gap-2 portrait-mobile-sm:items-stretch">
              <div className="flex gap-2">
                <SelectComponent
                  items={sharedBooks ?? []}
                  selectedId={mainSource?.book?.id}
                  idSelector={(book) => book}
                  nameSelector={(book) => book}
                  onSelect={(book) => {
                    setBook(book);
                  }}
                />
                <SelectComponent
                  items={mainSource?.book?.chapters ?? []}
                  selectedId={mainSource?.chapter?.id}
                  idSelector={(chapter) => chapter}
                  nameSelector={(chapter) => chapter.split(".")[1]}
                  onSelect={(chapter) => {
                    setChapter(chapter);
                  }}
                />
              </div>

              <div className="flex flex-row items-center gap-2 portrait-mobile-sm:justify-end">
                <h1
                  className={`font-semibold flex items-center gap-2 transition-all text-gray-600 landscape-mobile:text-sm portrait-mobile:hidden text-lg ${
                    isScrolled ? "visible" : "invisible"
                  }`}
                >
                  {mainSource?.book?.name} {mainSource?.chapter?.number}
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
                    icon={<House size={16} color="black" />}
                  />
                )}
                {!isScrolled ? (
                  <CircleButton
                    onClick={() => {
                      setShowGlossText(!showGlossText);
                    }}
                    icon={
                      showGlossText ? <Article size={16} /> : <Rows size={16} />
                    }
                  />
                ) : (
                  <CircleButton
                    onClick={() => {
                      setShowGlossText(!showGlossText);
                    }}
                    icon={
                      showGlossText ? (
                        <Article size={16} color="black" />
                      ) : (
                        <Rows size={16} color="black" />
                      )
                    }
                  />
                )}
                {showAudioButton ? (
                  isLoadingAudio ? (
                    <CircleContainer icon={<LoadingSpinner size={16} />} />
                  ) : !isScrolled ? (
                    <CircleButton
                      className={`${
                        isAudioEnabled
                          ? isAudioPlaying
                            ? "bg-green-500"
                            : "bg-yellow-500"
                          : ""
                      }`}
                      onClick={() => {
                        setIsAudioEnabled(!isAudioEnabled);
                      }}
                      icon={
                        <Headphones
                          className={`${
                            isAudioEnabled && isAudioPlaying
                              ? "animate-ping"
                              : ""
                          }`}
                          size={16}
                        />
                      }
                    />
                  ) : (
                    <CircleButton
                      className={`${
                        isAudioEnabled
                          ? isAudioPlaying
                            ? "bg-green-500"
                            : "bg-yellow-500"
                          : ""
                      }`}
                      onClick={() => {
                        setIsAudioEnabled(!isAudioEnabled);
                      }}
                      icon={
                        <Headphones
                          className={`${
                            isAudioEnabled && isAudioPlaying
                              ? "animate-ping"
                              : ""
                          }`}
                          size={16}
                          color={`${isAudioEnabled ? "white" : "black"}`}
                        />
                      }
                    />
                  )
                ) : (
                  <div></div>
                )}
              </div>
            </nav>
          </div>
        </header>
      )}

      <main>{children}</main>
      <LeftCircleButton
        color={"black"}
        className={`fixed top-[calc(50%+8px)] left-2 ${
          showPreviousChapter ? "block" : "invisible"
        } bg-white`}
        onClick={handlePreviousChapter}
      />
      <RightCircleButton
        color={"black"}
        className={`fixed top-[calc(50%+8px)] right-2 ${
          showNextChapter ? "block" : "invisible"
        } bg-white`}
        onClick={handleNextChapter}
      />
      {showLoading && (
        <div
          className={`fixed inset-0 bg-white ${
            mainSource ? "bg-opacity-50" : ""
          } flex flex-col items-center justify-center`}
        >
          <LoadingSpinner size={32} className="mt-16" />
          {!mainSource && (
            <p className="text-gray-500 text-sm">Initializing bible data...</p>
          )}
        </div>
      )}
      <ChapterAudio className="fixed bottom-0 left-[50%] translate-x-[-50%]" />
    </section>
  );
}
