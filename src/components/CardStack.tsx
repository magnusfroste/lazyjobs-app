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
          style={{
            position: index === 0 ? "relative" : "absolute",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 10 - index,
            transform: `scale(${1 - index * 0.05}) translateY(${index * 10}px)`,
            opacity: index === 0 ? 1 : 1 - (index * 0.4),
            filter: index === 0 ? "none" : `blur(${index * 2}px)`,
            pointerEvents: index === 0 ? "auto" : "none",
            transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
            animation: index === 0 ? "scale-in 0.3s ease-out" : "none",
          }}
        >
          {card}
        </div>
      ))}
    </div>
  );
};
