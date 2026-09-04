"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { CaretDown, MagnifyingGlass } from "@phosphor-icons/react";
import { bookNameLookup } from "@bible-app/domain";

type BookOption = { id: string; name: string };

export default function BookSearchSelect({
  bookIds,
  selectedBookId,
  onSelect,
  className,
}: {
  bookIds: string[];
  selectedBookId?: string;
  onSelect: (bookId: string) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const selectedLabel = selectedBookId
    ? (bookNameLookup.get(selectedBookId) ?? selectedBookId)
    : "Select book";

  const filtered = useMemo<BookOption[]>(() => {
    const items: BookOption[] = bookIds.map((id) => ({
      id,
      name: bookNameLookup.get(id) ?? id,
    }));
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(({ id, name }) => {
      const n = name.toLowerCase();
      const stripped = n.replace(/^\d+\s+/, "");
      return (
        n.startsWith(q) ||
        stripped.startsWith(q) ||
        id.toLowerCase().startsWith(q)
      );
    });
  }, [bookIds, query]);

  useEffect(() => {
    setHighlight(0);
  }, [query, open]);

  useEffect(() => {
    if (!open) return;
    const onMouseDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [open]);

  useEffect(() => {
    if (open) {
      const id = window.setTimeout(() => inputRef.current?.focus(), 0);
      return () => window.clearTimeout(id);
    }
    setQuery("");
  }, [open]);

  useEffect(() => {
    const el = listRef.current?.children[highlight] as HTMLElement | undefined;
    el?.scrollIntoView({ block: "nearest" });
  }, [highlight]);

  const commit = (id: string) => {
    onSelect(id);
    setOpen(false);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = filtered[highlight];
      if (item) commit(item.id);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
    }
  };

  return (
    <div ref={rootRef} className={`relative ${className ?? ""}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full py-4 pl-6 pr-12 hover:cursor-pointer appearance-none text-center text-sm text-gray-600 font-semibold rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
      >
        {selectedLabel}
      </button>
      <CaretDown
        size={16}
        className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2"
      />
      {open && (
        <div className="absolute z-50 mt-2 left-0 w-64 max-w-[90vw] rounded-lg border border-gray-200 bg-white shadow-lg">
          <div className="flex items-center gap-2 border-b border-gray-200 px-3 py-2">
            <MagnifyingGlass size={16} className="text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Search books…"
              className="w-full text-sm focus:outline-none"
            />
          </div>
          <ul ref={listRef} className="max-h-72 overflow-auto py-1">
            {filtered.length === 0 && (
              <li className="px-3 py-2 text-sm text-gray-500">No matches</li>
            )}
            {filtered.map((item, i) => {
              const isSelected = item.id === selectedBookId;
              const isHighlighted = i === highlight;
              return (
                <li
                  key={item.id}
                  onMouseEnter={() => setHighlight(i)}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    commit(item.id);
                  }}
                  className={`cursor-pointer px-3 py-2 text-sm ${
                    isHighlighted ? "bg-blue-50" : ""
                  } ${
                    isSelected
                      ? "font-semibold text-blue-700"
                      : "text-gray-800"
                  }`}
                >
                  {item.name}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
