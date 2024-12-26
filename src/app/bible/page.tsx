"use client";

import { useEffect } from "react";
import { useBibleStore } from "./bible.store";

export default function BiblePage() {
  const { ancientSource, englishSource, ancientBibles, englishBibles } =
    useBibleStore();
  return (
    <section>
      <div className="h-10"></div>
      <h1 className="text-3xl font-bold text-center">Sacred Scripture</h1>
      <div className="h-10"></div>
      <div className="flex flex-col landscape:flex-row landscape:justify-around gap-10">
        <div className="flex flex-col items-center landscape:items-start gap-2">
          <h2 className="px-2 text-lg font-bold">Ancient Text</h2>
          <select className="px-2 font-semibold py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all">
            {ancientBibles.map((bible) => (
              <option key={bible.id} value={ancientSource?.bible?.id}>
                {bible.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col items-center landscape:items-end gap-2">
          <h2 className="px-2 text-lg font-bold">English Text</h2>
          <select className="px-2 font-semibold py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all">
            {englishBibles.map((bible) => (
              <option key={bible.id} value={englishSource?.bible?.id}>
                {bible.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </section>
  );
}
