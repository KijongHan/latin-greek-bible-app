"use client";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { CaretDown, MagnifyingGlass } from "@phosphor-icons/react";

export default function SearchSelect<T>({
  items,
  selectedId,
  idSelector,
  nameSelector,
  onSelect,
  className,
  placeholder,
  searchable = true,
}: {
  items: T[];
  selectedId?: string;
  idSelector: (item: T) => string;
  nameSelector: (item: T) => string;
  onSelect: (item: T) => void;
  className?: string;
  placeholder?: string;
  searchable?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const listboxId = useId();
  const optionId = (id: string) => `${listboxId}-opt-${id}`;

  const selectedItem = items.find((item) => idSelector(item) === selectedId);
  const selectedLabel = selectedItem
    ? nameSelector(selectedItem)
    : (placeholder ?? "Select…");

  const filtered = useMemo(() => {
    if (!searchable) return items;
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => {
      const n = nameSelector(item).toLowerCase();
      const stripped = n.replace(/^\d+\s+/, "");
      return (
        n.startsWith(q) ||
        stripped.startsWith(q) ||
        idSelector(item).toLowerCase().startsWith(q)
      );
    });
  }, [items, query, searchable, idSelector, nameSelector]);

  const activeItem = open ? filtered[highlight] : undefined;
  const activeOptionId = activeItem
    ? optionId(idSelector(activeItem))
    : undefined;

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
    if (open && searchable) {
      const id = window.setTimeout(() => inputRef.current?.focus(), 0);
      return () => window.clearTimeout(id);
    }
    if (!open) setQuery("");
  }, [open, searchable]);

  useEffect(() => {
    const el = listRef.current?.children[highlight] as HTMLElement | undefined;
    el?.scrollIntoView({ block: "nearest" });
  }, [highlight]);

  const commit = (item: T) => {
    onSelect(item);
    setOpen(false);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) {
        setOpen(true);
        return;
      }
      setHighlight((h) => Math.min(h + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) {
        setOpen(true);
        return;
      }
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      if (!open) return;
      e.preventDefault();
      const item = filtered[highlight];
      if (item) commit(item);
    } else if (e.key === "Escape") {
      if (!open) return;
      e.preventDefault();
      setOpen(false);
    }
  };

  return (
    <div ref={rootRef} className={`relative ${className ?? ""}`}>
      <button
        type="button"
        role={!searchable ? "combobox" : undefined}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        aria-activedescendant={!searchable ? activeOptionId : undefined}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={!searchable ? onKeyDown : undefined}
        className="w-full py-4 pl-6 pr-12 hover:cursor-pointer appearance-none text-center text-sm text-gray-600 font-semibold rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
      >
        {selectedLabel}
      </button>
      <CaretDown
        size={16}
        className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2"
      />
      {open && (
        <div className="absolute z-50 mt-2 left-0 min-w-full w-max max-w-[90vw] rounded-lg border border-gray-200 bg-white shadow-lg">
          {searchable && (
            <div className="flex items-center gap-2 border-b border-gray-200 px-3 py-2">
              <MagnifyingGlass size={16} className="text-gray-400" />
              <input
                ref={inputRef}
                role="combobox"
                type="search"
                aria-autocomplete="list"
                aria-expanded={open}
                aria-controls={listboxId}
                aria-activedescendant={activeOptionId}
                aria-label="Search options"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Search…"
                className="w-full text-sm focus:outline-none"
              />
            </div>
          )}
          <ul
            ref={listRef}
            id={listboxId}
            role="listbox"
            className="max-h-72 overflow-auto py-1"
          >
            {filtered.length === 0 && (
              <li
                role="presentation"
                className="px-3 py-2 text-sm text-gray-500"
              >
                No matches
              </li>
            )}
            {filtered.map((item, i) => {
              const id = idSelector(item);
              const isSelected = id === selectedId;
              const isHighlighted = i === highlight;
              return (
                <li
                  key={id}
                  id={optionId(id)}
                  role="option"
                  aria-selected={isSelected}
                  onMouseEnter={() => setHighlight(i)}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    commit(item);
                  }}
                  className={`cursor-pointer px-3 py-2 text-sm ${
                    isHighlighted ? "bg-blue-50" : ""
                  } ${
                    isSelected
                      ? "font-semibold text-blue-700"
                      : "text-gray-800"
                  }`}
                >
                  {nameSelector(item)}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
