import { ReactElement } from "react";

interface CardStackProps {
  cards: ReactElement[];
  previewCount?: number;
}

/**
 * CardStack - Presentational component for stacking cards with Tinder-style layout
 * Handles only the visual layout, not the card content or business logic
 */
export const CardStack = ({ cards, previewCount = 3 }: CardStackProps) => {
  const visibleCards = cards.slice(0, previewCount);

  return (
    <div className="relative w-full animate-fade-in" style={{ touchAction: "pan-y" }}>
      {visibleCards.map((card, index) => (
        <div
          key={index}
          className="transition-all duration-300 ease-out"
          style={{
            position: index === 0 ? "relative" : "absolute",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 10 - index,
            transform: `scale(${1 - index * 0.05}) translateY(${index * 10}px)`,
            pointerEvents: index === 0 ? "auto" : "none",
          }}
        >
          {card}
        </div>
      ))}
    </div>
  );
};
