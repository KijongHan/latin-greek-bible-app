"use client";
import { useEffect, useState } from "react";
import { useBibleStore } from "./bible.store";
import { bookIdLookup } from "./bible.data";

export default function BibleLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [scrolled, setScrolled] = useState(false);
  const { ancientSource, englishSource, initialize } = useBibleStore();

  useEffect(() => {
    initialize();
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <section>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? "bg-white shadow-md py-2" : "bg-transparent py-4"
        }`}
      >
        {ancientSource && englishSource ? (
          <div className="container mx-auto px-4">
            <nav className="flex items-center justify-between">
              <div className="flex gap-2">
                <select
                  className={`px-2 font-semibold py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                    scrolled ? "text-lg" : "text-xl"
                  }`}
                  value={ancientSource?.bible?.abbreviation}
                  onChange={(e) => {}}
                >
                  {ancientSource?.bible?.books.map((book) => (
                    <option className="text-left" key={book} value={book}>
                      {book}
                    </option>
                  ))}
                </select>
                <select
                  className={`px-2 font-semibold py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                    scrolled ? "text-lg" : "text-xl"
                  }`}
                >
                  {ancientSource?.book?.chapters.map((chapter) => (
                    <option className="text-left" key={chapter} value={chapter}>
                      {chapter.split(".")[1]}
                    </option>
                  ))}
                </select>
              </div>

              <h1
                className={`font-semibold flex items-center gap-2 transition-all ${
                  scrolled ? "text-gray-800 text-base" : "text-gray-600 text-lg"
                }`}
              >
                {ancientSource?.book?.name} {ancientSource?.chapter?.number}
              </h1>
            </nav>
          </div>
        ) : (
          <div className="container mx-auto px-4">
            <h1 className="text-3xl font-bold text-center">Sacred Scripture</h1>
          </div>
        )}
      </header>

      <main className="mt-16">{children}</main>
    </section>
  );
}
