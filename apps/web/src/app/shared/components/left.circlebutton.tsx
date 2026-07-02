import { CaretLeft } from "@phosphor-icons/react";
import CircleButton from "./circlebutton";

export default function LeftCircleButton({
  onClick,
  className,
  color,
}: {
  onClick: () => void;
  className?: string;
  color?: string;
}) {
  return (
    <CircleButton
      className={className}
      onClick={onClick}
      icon={<CaretLeft size={16} color={color} />}
    />
  );
}
