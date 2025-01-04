export default function CircleContainer({
  className,
  icon,
}: {
  className?: string;
  icon: React.ReactNode;
}) {
  return (
    <div className={`rounded-full shadow-md p-4 ${className}`}>{icon}</div>
  );
}
