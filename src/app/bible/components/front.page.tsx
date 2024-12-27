"use client";
import { CaretDown } from "@phosphor-icons/react";
import { useBibleStore } from "../bible.store";
import SelectComponent from "@/app/shared/components/select.component";
import { useAppStore } from "@/app/app.store";

export default function FrontPage() {
  const { isScrolled } = useAppStore();
  const { ancientSource, englishSource, ancientBibles, englishBibles } =
    useBibleStore();
  return (
    <section>
      <div className="h-8"></div>
      <h1
        className={`text-6xl font-bold text-center title ${
          isScrolled ? "hidden" : "block"
        }`}
      >
        Bible
      </h1>
      <div className="h-10"></div>
      <div className="flex flex-col landscape:flex-row landscape:justify-around gap-4">
        <div className="flex flex-col items-center landscape:items-center gap-2">
          <label className="px-2 text-base text-gray-500">Ancient Text</label>
          <SelectComponent
            items={ancientBibles}
            idSelector={(bible) => bible.id}
            nameSelector={(bible) => bible.name}
            onSelect={(bible) => {
              // setAncientSource({ ...ancientSource, bible });
            }}
          />
        </div>
        <div className="flex flex-col items-center landscape:items-center gap-2">
          <label className="px-2 text-base text-gray-500">English Text</label>
          <SelectComponent
            items={englishBibles}
            idSelector={(bible) => bible.id}
            nameSelector={(bible) => bible.name}
            onSelect={(bible) => {
              // setAncientSource({ ...ancientSource, bible });
            }}
          />
        </div>
      </div>
      <div className="h-10"></div>
      <footer>sadfsd;if;opsjf</footer>
    </section>
  );
}
