"use client";
import { CaretDown, MagnifyingGlass } from "@phosphor-icons/react";
import { useBibleStore } from "../bible.store";
import SelectComponent from "@/app/shared/components/select.component";
import { useAppStore } from "@/app/app.store";
import SearchInput from "@/app/shared/components/search.input";

export default function FrontPage() {
  const { isScrolled } = useAppStore();
  const { ancientSource, englishSource, ancientBibles, englishBibles } =
    useBibleStore();
  return (
    <section className="p-4">
      <h1
        className={`text-6xl font-bold text-center title ${
          isScrolled ? "hidden" : "block"
        }`}
      >
        Bible
      </h1>
      <div className="h-5"></div>
      <div className="flex flex-row portrait-mobile:flex-col landscape:justify-around gap-2">
        <div className="flex flex-col items-start landscape:items-center">
          <label className="px-2 text-base text-gray-500">Ancient Text</label>
          <SelectComponent
            className="w-full"
            items={ancientBibles}
            idSelector={(bible) => bible.id}
            nameSelector={(bible) => bible.name}
            onSelect={(bible) => {
              // setAncientSource({ ...ancientSource, bible });
            }}
          />
        </div>
        <div className="flex flex-col items-start landscape:items-center">
          <label className="px-2 text-base text-gray-500">English Text</label>
          <SelectComponent
            className="w-full"
            items={englishBibles}
            idSelector={(bible) => bible.id}
            nameSelector={(bible) => bible.name}
            onSelect={(bible) => {
              // setAncientSource({ ...ancientSource, bible });
            }}
          />
        </div>
      </div>
      <div className="h-5"></div>
      <div className="flex flex-col items-start justify-center">
        <label className="px-2 text-base text-gray-500">Chapters</label>
        <SearchInput className="w-full md:w-1/2" />
      </div>
      <footer></footer>
    </section>
  );
}
