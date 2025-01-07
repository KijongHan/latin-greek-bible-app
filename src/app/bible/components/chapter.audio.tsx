"use client";
import { useEffect, useState } from "react";
import { useBibleStore } from "../bible.store";
import { audioTimes, useBibleAudioStore } from "../bibleaudio.store";
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
let audioTimerId: NodeJS.Timeout | undefined;
let audioIntervalId: NodeJS.Timeout | undefined;

export default function ChapterAudio({ className }: { className?: string }) {
  const [audioTimeRemaining, setAudioTimeRemaining] = useState<
    number | undefined
  >(undefined);
  const {
    glossChapterAudio,
    mainChapterAudio,
    setCurrentBibleVerseId,
    currentBibleVerseId,
    currentChapterId,
    isAudioEnabled,
    isAudioPlaying,
    isLoading: isLoadingAudio,
    setIsAudioPlaying,
    clearChapterAudio,
    loadChapterAudioForBibles,
    setAudioTimer,
    audioTimer,
    setIsAudioEnabled,
  } = useBibleAudioStore();
  const { glossSource, mainSource, nextChapter, showGlossText } =
    useBibleStore();

  useEffect(() => {
    if (glossChapterAudio && mainChapterAudio) {
      const contentType = "audio/mp3";
      const verses = mainChapterAudio.versesAudio
        .map((a, i) =>
          showGlossText ? [a, glossChapterAudio.versesAudio[i]] : [a]
        )
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
          setIsAudioPlaying(true);
          setCurrentBibleVerseId(a[1]);
        });
        a[0].on("pause", () => {
          setIsAudioPlaying(false);
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
      setIsAudioPlaying(true);
    }
    return () => {
      sounds.forEach((a) => a[0].unload());
      sounds = [];
      setIsAudioPlaying(false);
    };
  }, [glossChapterAudio, mainChapterAudio, showGlossText]);

  useEffect(() => {
    if (!currentChapterId) {
      sounds.forEach((a) => a[0].unload());
      sounds = [];
      setCurrentBibleVerseId(undefined);
      setIsAudioPlaying(false);
    }
  }, [currentChapterId]);

  useEffect(() => {
    console.log(currentChapterId, mainSource?.chapter?.id);
    if (currentChapterId && currentChapterId !== mainSource?.chapter?.id) {
      sounds.forEach((a) => a[0].pause());
      sounds.forEach((a) => a[0].unload());
      sounds = [];
      setCurrentBibleVerseId(undefined);
      setIsAudioPlaying(false);
    }
  }, [currentChapterId, mainSource, glossSource]);

  useEffect(() => {
    if (!glossSource?.chapter?.id) {
      clearChapterAudio();
      return;
    }

    if (isAudioEnabled) {
      loadChapterAudioForBibles(
        glossSource?.bible?.id ?? "",
        mainSource?.bible?.id ?? "",
        mainSource?.chapter?.id ?? ""
      );
    } else {
      sounds.forEach((a) => a[0].unload());
      sounds = [];
      setCurrentBibleVerseId(undefined);
      setIsAudioPlaying(false);
    }
  }, [
    isAudioEnabled,
    glossSource?.bible?.id,
    mainSource?.bible?.id,
    mainSource?.chapter?.id,
  ]);

  useEffect(() => {
    if (currentBibleVerseId) {
      scrollToVerse(currentBibleVerseId);
    }
  }, [currentBibleVerseId]);

  useEffect(() => {
    if (audioTimer) {
      clearTimeout(audioTimerId);
      audioTimerId = setTimeout(() => {
        setAudioTimer(undefined);
        setAudioTimeRemaining(undefined);
        setIsAudioEnabled(false);
      }, audioTimer * 1000 * 60);
      clearInterval(audioIntervalId);
      setAudioTimeRemaining(audioTimer * 60);
      audioIntervalId = setInterval(() => {
        setAudioTimeRemaining((prev) => {
          console.log(prev);
          return prev ? (prev - 1 < 0 ? undefined : prev - 1) : undefined;
        });
      }, 1000);
    } else {
      clearTimeout(audioTimerId);
      clearInterval(audioIntervalId);
      setAudioTimeRemaining(undefined);
    }
  }, [audioTimer]);

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
    <div className={`${className} flex flex-col w-full p-4 bg-white shadow-md`}>
      {audioTimer && audioTimeRemaining && (
        <div className="justify-center items-center flex">
          Time remaining:{" "}
          {`${
            Math.floor(audioTimeRemaining / 60) === 0
              ? "00"
              : `${Math.floor(audioTimeRemaining / 60)}`
          }:${audioTimeRemaining % 60 < 10 ? "0" : ""}${
            audioTimeRemaining % 60
          }`}
        </div>
      )}
      <div className="flex flex-row items-center justify-center">
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
          className={`${audioTimer ? "bg-green-500" : "bg-white"}`}
          icon={<Timer size={16} color={audioTimer ? "white" : "black"} />}
          onClick={() => {
            if (audioTimer) {
              setAudioTimer(undefined);
            } else {
              setAudioTimer(audioTimes[0]);
            }
          }}
        />
      </div>
    </div>
  ) : (
    <div></div>
  );
}
