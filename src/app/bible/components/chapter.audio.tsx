"use client";
import { useEffect } from "react";
import { useBibleStore } from "../bible.store";
import { useBibleAudioStore } from "../bibleaudio.store";
import { Howl } from "howler";
import CircleButton from "@/app/shared/components/circlebutton";
import {
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Timer,
} from "@phosphor-icons/react";
import LoadingSpinner from "@/app/shared/components/loading.spinner";

let sounds: [Howl, string][] = [];

export default function ChapterAudio({ className }: { className?: string }) {
  const {
    englishChapterAudio,
    ancientChapterAudio,
    setCurrentBibleVerseId,
    currentBibleVerseId,
    currentChapterId,
    isAudioEnabled,
    isAudioPlaying,
    isLoading: isLoadingAudio,
    setIsAudioPlaying,
    clearChapterAudio,
    loadChapterAudioForBibles,
  } = useBibleAudioStore();
  const { englishSource, ancientSource, nextChapter } = useBibleStore();

  useEffect(() => {
    if (englishChapterAudio && ancientChapterAudio) {
      const contentType = "audio/mp3";
      const verses = englishChapterAudio.versesAudio
        .map((a, i) => [a, ancientChapterAudio.versesAudio[i]])
        .flat()
        .filter((v) => v !== undefined);
      sounds = verses.map((v) => {
        return [
          new Howl({
            src: `data:${contentType};base64,${Buffer.from(v.data).toString(
              "base64"
            )}`,
            html5: true,
          }),
          `${v.bibleId}.${v.verseId}`,
        ];
      });
      sounds.forEach((a, i, array) => {
        a[0].on("play", () => {
          setCurrentBibleVerseId(a[1]);
        });
        a[0].on("end", () => {
          a[0].stop();
          if (i + 1 < array.length) {
            array[i + 1][0].play();
          } else {
            nextChapter();
            setCurrentBibleVerseId(undefined);
            setIsAudioPlaying(false);
          }
        });
      });
      sounds[0][0].play();
      sounds[0][0].once("end", () => {
        setCurrentBibleVerseId(undefined);
        setIsAudioPlaying(false);
      });
      setIsAudioPlaying(true);
    }
    return () => {
      sounds.forEach((a) => a[0].unload());
      sounds = [];
      setIsAudioPlaying(false);
    };
  }, [englishChapterAudio, ancientChapterAudio]);

  useEffect(() => {
    if (!currentChapterId) {
      sounds.forEach((a) => a[0].unload());
      sounds = [];
      setCurrentBibleVerseId(undefined);
      setIsAudioPlaying(false);
    }
  }, [currentChapterId]);

  useEffect(() => {
    console.log(currentChapterId, ancientSource?.chapter?.id);
    if (currentChapterId && currentChapterId !== ancientSource?.chapter?.id) {
      sounds.forEach((a) => a[0].pause());
      sounds.forEach((a) => a[0].unload());
      sounds = [];
      setCurrentBibleVerseId(undefined);
      setIsAudioPlaying(false);
    }
  }, [currentChapterId, ancientSource, englishSource]);

  useEffect(() => {
    if (!englishSource?.chapter?.id) {
      clearChapterAudio();
      return;
    }

    if (isAudioEnabled) {
      loadChapterAudioForBibles(
        englishSource?.bible?.id ?? "",
        ancientSource?.bible?.id ?? "",
        englishSource?.chapter?.id ?? ""
      );
    } else {
      sounds.forEach((a) => a[0].unload());
      sounds = [];
      setCurrentBibleVerseId(undefined);
      setIsAudioPlaying(false);
    }
  }, [
    isAudioEnabled,
    englishSource?.bible?.id,
    ancientSource?.bible?.id,
    englishSource?.chapter?.id,
  ]);

  useEffect(() => {
    if (currentBibleVerseId) {
      scrollToVerse(currentBibleVerseId);
    }
  }, [currentBibleVerseId]);

  const scrollToVerse = (verseId: string) => {
    const verseElement = document.getElementById(verseId);
    if (verseElement) {
      verseElement.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  const nextVerse = () => {
    sounds.forEach((a) => a[0].stop());
    const currentIndex = sounds.findIndex((a) => a[1] === currentBibleVerseId);
    if (currentIndex + 1 < sounds.length) {
      sounds[currentIndex + 1][0].play();
      setIsAudioPlaying(true);
    } else {
      setCurrentBibleVerseId(undefined);
      setIsAudioPlaying(false);
    }
  };

  const previousVerse = () => {
    sounds.forEach((a) => a[0].stop());
    const currentIndex = sounds.findIndex((a) => a[1] === currentBibleVerseId);
    if (currentIndex - 1 >= 0) {
      sounds[currentIndex - 1][0].play();
      setIsAudioPlaying(true);
    } else {
      setCurrentBibleVerseId(undefined);
      setIsAudioPlaying(false);
    }
  };

  const togglePlay = () => {
    if (isAudioPlaying) {
      sounds.forEach((a) => a[0].pause());
    } else {
      if (currentBibleVerseId) {
        sounds.find((a) => a[1] === currentBibleVerseId)?.[0]?.play();
        scrollToVerse(currentBibleVerseId);
      } else {
        sounds[0][0].play();
      }
    }
    setIsAudioPlaying(!isAudioPlaying);
  };

  return isAudioEnabled ? (
    <div
      className={`${className} flex flex-row w-full items-center justify-center p-4 bg-white shadow-md`}
    >
      <CircleButton
        className="bg-white invisible"
        icon={<Timer size={16} color="black" />}
        onClick={() => {}}
      />
      <div className="flex-grow"></div>
      <div className={`flex flex-row portrait-mobile:gap-2 gap-4`}>
        <CircleButton
          className="bg-white"
          icon={
            isLoadingAudio ? (
              <LoadingSpinner size={16} />
            ) : (
              <SkipBack size={16} color="black" />
            )
          }
          onClick={previousVerse}
        />
        <CircleButton
          className="bg-white"
          icon={
            isLoadingAudio ? (
              <LoadingSpinner size={16} />
            ) : isAudioPlaying ? (
              <Pause size={16} color="black" />
            ) : (
              <Play size={16} color="black" />
            )
          }
          onClick={togglePlay}
        />
        <CircleButton
          className="bg-white"
          icon={
            isLoadingAudio ? (
              <LoadingSpinner size={16} />
            ) : (
              <SkipForward size={16} color="black" />
            )
          }
          onClick={nextVerse}
        />
      </div>
      <div className="flex-grow"></div>
      <CircleButton
        className="bg-white"
        icon={<Timer size={16} color="black" />}
        onClick={() => {}}
      />
    </div>
  ) : (
    <div></div>
  );
}
