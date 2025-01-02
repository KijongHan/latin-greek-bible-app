"use client";
import { useEffect, useState } from "react";
import { useBibleStore } from "../bible.store";
import { useBibleAudioStore } from "../bibleaudio.store";
import { Howl } from "howler";
import CircleButton from "@/app/shared/components/circlebutton";
import { Pause, Play, SkipBack, SkipForward } from "@phosphor-icons/react";

let sounds: [Howl, string][] = [];

export default function ChapterAudio({ className }: { className?: string }) {
  const {
    englishChapterAudio,
    ancientChapterAudio,
    setCurrentBibleVerseId,
    currentBibleVerseId,
    currentChapterId,
    isAudioEnabled,
    clearChapterAudio,
    loadChapterAudioForBibles,
  } = useBibleAudioStore();
  const { englishSource, ancientSource } = useBibleStore();
  const [isPlaying, setIsPlaying] = useState(false);

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
            setCurrentBibleVerseId(undefined);
            setIsPlaying(false);
          }
        });
      });
      sounds[0][0].play();
      setIsPlaying(true);
    }
    return () => {
      sounds.forEach((a) => a[0].unload());
      sounds = [];
      setIsPlaying(false);
    };
  }, [englishChapterAudio, ancientChapterAudio]);

  useEffect(() => {
    if (!currentChapterId) {
      sounds.forEach((a) => a[0].unload());
      sounds = [];
      setCurrentBibleVerseId(undefined);
      setIsPlaying(false);
    }
  }, [currentChapterId]);

  useEffect(() => {
    console.log(currentChapterId, ancientSource?.chapter?.id);
    if (currentChapterId && currentChapterId !== ancientSource?.chapter?.id) {
      sounds.forEach((a) => a[0].pause());
      sounds.forEach((a) => a[0].unload());
      sounds = [];
      setCurrentBibleVerseId(undefined);
      setIsPlaying(false);
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
      setIsPlaying(false);
    }
  }, [
    isAudioEnabled,
    englishSource?.bible?.id,
    ancientSource?.bible?.id,
    englishSource?.chapter?.id,
  ]);

  const nextVerse = () => {
    sounds.forEach((a) => a[0].stop());
    const currentIndex = sounds.findIndex((a) => a[1] === currentBibleVerseId);
    if (currentIndex + 1 < sounds.length) {
      sounds[currentIndex + 1][0].play();
      setIsPlaying(true);
    } else {
      setCurrentBibleVerseId(undefined);
      setIsPlaying(false);
    }
  };

  const previousVerse = () => {
    sounds.forEach((a) => a[0].stop());
    const currentIndex = sounds.findIndex((a) => a[1] === currentBibleVerseId);
    if (currentIndex - 1 >= 0) {
      sounds[currentIndex - 1][0].play();
      setIsPlaying(true);
    } else {
      setCurrentBibleVerseId(undefined);
      setIsPlaying(false);
    }
  };

  const togglePlay = () => {
    if (isPlaying) {
      sounds.forEach((a) => a[0].pause());
    } else {
      if (currentBibleVerseId) {
        sounds.find((a) => a[1] === currentBibleVerseId)?.[0]?.play();
      } else {
        sounds[0][0].play();
      }
    }
    setIsPlaying(!isPlaying);
  };

  return isAudioEnabled ? (
    <div
      className={`${className} flex flex-row items-center justify-center w-full gap-4`}
    >
      <CircleButton
        className="bg-white"
        icon={<SkipBack size={16} color="black" />}
        onClick={previousVerse}
      />
      <CircleButton
        className="bg-white"
        icon={
          isPlaying ? (
            <Pause size={16} color="black" />
          ) : (
            <Play size={16} color="black" />
          )
        }
        onClick={togglePlay}
      />
      <CircleButton
        className="bg-white"
        icon={<SkipForward size={16} color="black" />}
        onClick={nextVerse}
      />
    </div>
  ) : (
    <div></div>
  );
}
