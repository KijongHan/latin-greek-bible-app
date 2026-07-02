import { CaretRight } from "@phosphor-icons/react";
import CircleButton from "./circlebutton";

export default function RightCircleButton({
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
      icon={<CaretRight size={16} color={color} />}
    />
  );
}
