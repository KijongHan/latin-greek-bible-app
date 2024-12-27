"use client";
import { useAppStore } from "@/app/app.store";
import { useBibleStore } from "@/app/bible/bible.store";
import { useEffect } from "react";

export default function ChapterPage() {
  const { isScrolled } = useAppStore();
  const { ancientSource, englishSource } = useBibleStore();

  useEffect(() => {
    console.log(ancientSource, englishSource);
  }, [ancientSource, englishSource]);

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1
        className={`text-center font-semibold gap-2 transition-all text-gray-800 text-3xl ${
          isScrolled ? "invisible" : "visible"
        }`}
      >
        {ancientSource?.book?.name} {ancientSource?.chapter?.number}
      </h1>
      <div className="prose prose-lg space-y-2">
        {ancientSource?.chapter?.verses?.map((verse, index) => (
          <div key={verse.id}>
            <p className="flex gap-2">
              <span className="text-sm font-semibold text-gray-500 mt-1">
                {index + 1}
              </span>
              <span>{verse.text}</span>
            </p>
            <p className="flex gap-2 pl-6 text-gray-600 text-sm">
              <span>{englishSource?.chapter?.verses?.[index]?.text}</span>
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
