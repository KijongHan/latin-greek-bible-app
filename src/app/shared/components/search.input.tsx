import { MagnifyingGlass, Spinner } from "@phosphor-icons/react";
import LoadingSpinner from "./loading.spinner";

export default function SearchInput({
  className,
  placeholder,
  isLoading,
  onSearch,
}: {
  className?: string;
  placeholder?: string;
  isLoading?: boolean;
  onSearch?: (searchTerm: string) => void;
}) {
  return (
    <div className={`relative ${className}`}>
      <input
        readOnly={isLoading ?? false}
        type="text"
        placeholder={placeholder ?? "Search..."}
        className="w-full py-4 pl-6 pr-12 text-sm rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
        onChange={(e) => onSearch?.(e.target.value)}
      />
      {isLoading ? (
        <div className="absolute right-5 top-1/2 -translate-y-1/2">
          <LoadingSpinner size={16} />
        </div>
      ) : (
        <MagnifyingGlass
          size={16}
          className="absolute right-5 top-1/2 -translate-y-1/2"
        />
      )}
    </div>
  );
}
