"use client";
import { useBibleStore } from "@/app/bible/bible.store";
import { useEffect } from "react";

export default function Chapter() {
  const { ancientSource, englishSource, initialize } = useBibleStore();
  useEffect(() => {
    initialize();
  }, []);

  useEffect(() => {}, [ancientSource, englishSource]);

  return (
    <div className="max-w-3xl mx-auto p-4">
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
