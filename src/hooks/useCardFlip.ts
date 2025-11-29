import { useState } from 'react';

export const useCardFlip = () => {
  const [flippedCardId, setFlippedCardId] = useState<string | null>(null);
  
  const flipCard = (cardId: string) => {
    setFlippedCardId(cardId === flippedCardId ? null : cardId);
  };
  
  const closeFlip = () => {
    setFlippedCardId(null);
  };
  
  const isCardFlipped = (cardId: string) => flippedCardId === cardId;
  
  const isAnyCardFlipped = flippedCardId !== null;
  
  return { flipCard, closeFlip, isCardFlipped, isAnyCardFlipped };
};
