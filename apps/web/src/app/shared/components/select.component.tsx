import { useMemo } from "react";
import SearchSelect from "./search.select";

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
  const visibleItems = useMemo(
    () =>
      hideId ? items.filter((item) => idSelector(item) !== hideId) : items,
    [items, hideId, idSelector],
  );

  return (
    <SearchSelect
      items={visibleItems}
      selectedId={selectedId}
      idSelector={idSelector}
      nameSelector={nameSelector}
      onSelect={onSelect}
      className={className}
      searchable={false}
    />
  );
}
