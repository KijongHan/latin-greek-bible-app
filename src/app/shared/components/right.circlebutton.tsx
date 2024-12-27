import { CaretRight } from "@phosphor-icons/react";
import CircleButton from "./circlebutton";

export default function RightCircleButton({
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
      icon={<CaretRight size={16} />}
    />
  );
}
