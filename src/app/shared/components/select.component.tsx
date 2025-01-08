import { CaretDown } from "@phosphor-icons/react";

export default function SelectComponent<T>({
  items,
  selectedId,
  idSelector,
  nameSelector,
  onSelect,
  className,
  hideId,
}: {
  items: T[];
  idSelector: (item: T) => string;
  nameSelector: (item: T) => string;
  selectedId?: string;
  onSelect: (item: T) => void;
  className?: string;
  hideId?: string;
}) {
  return (
    <div className={`relative ${className}`}>
      <select
        className="w-full py-4 pl-6 pr-12 hover:cursor-pointer appearance-none text-center text-sm text-gray-600 font-semibold rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
        value={selectedId}
        onChange={(e) =>
          onSelect(items.find((item) => idSelector(item) === e.target.value)!)
        }
      >
        {items.map((item) => (
          <option
            hidden={hideId ? hideId === idSelector(item) : undefined}
            key={idSelector(item)}
            value={idSelector(item)}
          >
            {nameSelector(item)}
          </option>
        ))}
      </select>
      <CaretDown
        size={16}
        className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2"
      />
    </div>
  );
}
