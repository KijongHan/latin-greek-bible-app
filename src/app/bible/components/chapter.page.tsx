"use client";
import { useAppStore } from "@/app/app.store";
import { useBibleStore } from "@/app/bible/bible.store";
import { useEffect } from "react";
import { useBibleAudioStore } from "../bibleaudio.store";

export default function ChapterPage() {
  const { isScrolled } = useAppStore();
  const { currentBibleVerseId, isAudioPlaying } = useBibleAudioStore();
  const { mainSource, glossSource, showGlossText } = useBibleStore();

  useEffect(() => {
    console.log(currentBibleVerseId);
  }, [currentBibleVerseId]);

  useEffect(() => {
    console.log(mainSource, glossSource);
  }, [mainSource, glossSource]);

  return (
    <div className="max-w-3xl mx-auto p-4 mt-16 portrait-mobile-sm:mt-32 mb-16">
      <h1
        className={`text-center font-semibold gap-2 transition-all text-3xl ${
          isScrolled ? "invisible" : "visible"
        }`}
      >
        {mainSource?.book?.name} {mainSource?.chapter?.number}
      </h1>
      <div className="prose prose-lg space-y-2">
        {mainSource?.chapter?.verses?.map((verse, index) => (
          <div key={verse.id}>
            <p
              id={`${mainSource?.bible?.id}.${verse.id}`}
              className={`flex gap-2 ${
                currentBibleVerseId === `${mainSource?.bible?.id}.${verse.id}`
                  ? isAudioPlaying
                    ? "text-green-500"
                    : "text-yellow-500"
                  : ""
              }`}
            >
              <span
                className={`text-sm font-semibold ${
                  currentBibleVerseId === `${mainSource?.bible?.id}.${verse.id}`
                    ? isAudioPlaying
                      ? "text-green-500"
                      : "text-yellow-500"
                    : ""
                } mt-1`}
              >
                {index + 1}
              </span>
              <span>{verse.text}</span>
            </p>
            {showGlossText && (
              <p
                id={`${glossSource?.bible?.id}.${verse.id}`}
                className={`flex gap-2 pl-6 ${
                  currentBibleVerseId ===
                  `${glossSource?.bible?.id}.${verse.id}`
                    ? isAudioPlaying
                      ? "text-green-500"
                      : "text-yellow-500"
                    : "text-gray-600"
                } text-sm`}
              >
                <span>{glossSource?.chapter?.verses?.[index]?.text}</span>
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
