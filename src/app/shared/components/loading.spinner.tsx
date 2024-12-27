import { CircleNotch } from "@phosphor-icons/react";

export default function LoadingSpinner({
  className,
  size,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <CircleNotch size={size ?? 32} className={`animate-spin ${className}`} />
  );
}
