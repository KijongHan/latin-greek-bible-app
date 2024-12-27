import { CaretLeft } from "@phosphor-icons/react";
import CircleButton from "./circlebutton";

export default function LeftCircleButton({
  onClick,
  className,
}: {
  onClick: () => void;
  className?: string;
}) {
  return (
    <CircleButton
      className={className}
      onClick={onClick}
      icon={<CaretLeft size={16} />}
    />
  );
}
