"use client";
import { useAppStore } from "@/app/app.store";
import { useBibleStore } from "@/app/bible/bible.store";
import { useEffect } from "react";
import { useBibleAudioStore } from "../bibleaudio.store";

export default function ChapterPage() {
  const { isScrolled } = useAppStore();
  const { currentBibleVerseId } = useBibleAudioStore();
  const { ancientSource, englishSource } = useBibleStore();

  useEffect(() => {
    console.log(currentBibleVerseId);
  }, [currentBibleVerseId]);

  useEffect(() => {
    console.log(ancientSource, englishSource);
  }, [ancientSource, englishSource]);

  return (
    <div className="max-w-3xl mx-auto p-4 mt-16 mb-16">
      <h1
        className={`text-center font-semibold gap-2 transition-all text-3xl ${
          isScrolled ? "invisible" : "visible"
        }`}
      >
        {ancientSource?.book?.name} {ancientSource?.chapter?.number}
      </h1>
      <div className="prose prose-lg space-y-2">
        {ancientSource?.chapter?.verses?.map((verse, index) => (
          <div key={verse.id}>
            <p
              className={`flex gap-2 ${
                currentBibleVerseId ===
                `${englishSource?.bible?.id}.${verse.id}`
                  ? "text-green-500"
                  : ""
              }`}
            >
              <span
                className={`text-sm font-semibold ${
                  currentBibleVerseId ===
                  `${englishSource?.bible?.id}.${verse.id}`
                    ? "text-green-500"
                    : ""
                } mt-1`}
              >
                {index + 1}
              </span>
              <span>{englishSource?.chapter?.verses?.[index]?.text}</span>
            </p>
            <p
              className={`flex gap-2 pl-6 ${
                currentBibleVerseId ===
                `${ancientSource?.bible?.id}.${verse.id}`
                  ? "text-green-500"
                  : "text-gray-600"
              } text-sm`}
            >
              <span>{verse.text}</span>
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
