export default function CircleButton({
  onClick,
  className,
  icon,
}: {
  onClick: () => void;
  className?: string;
  icon: React.ReactNode;
}) {
  return (
    <button
      className={`rounded-full shadow-md p-4 ${className}`}
      onClick={onClick}
    >
      {icon}
    </button>
  );
}
