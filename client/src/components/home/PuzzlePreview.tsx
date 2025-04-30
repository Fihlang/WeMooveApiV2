import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RefreshCw, ChevronRight } from "lucide-react";
import { Link } from "wouter";

export default function PuzzlePreview() {
  // Sample cards for the preview puzzle
  const initialCards = [
    { id: 1, type: "symbol", content: "和", flipped: false, matched: false },
    { id: 2, type: "symbol", content: "愛", flipped: false, matched: false },
    { id: 3, type: "meaning", content: "Harmony", flipped: false, matched: false },
    { id: 4, type: "meaning", content: "Love", flipped: false, matched: false },
    { id: 5, type: "symbol", content: "道", flipped: false, matched: false },
    { id: 6, type: "symbol", content: "夢", flipped: false, matched: false },
    { id: 7, type: "meaning", content: "Way/Path", flipped: false, matched: false },
    { id: 8, type: "meaning", content: "Dream", flipped: false, matched: false },
  ];

  const [cards, setCards] = useState(initialCards);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [matchedPairs, setMatchedPairs] = useState(0);
  const [progress, setProgress] = useState(0);

  const handleCardClick = (id: number) => {
    // Don't allow clicking if two cards are already flipped
    if (flippedCards.length === 2) return;
    
    // Don't allow clicking already matched or flipped cards
    const cardIndex = cards.findIndex(card => card.id === id);
    if (cards[cardIndex].matched || cards[cardIndex].flipped) return;

    // Flip the card
    const updatedCards = [...cards];
    updatedCards[cardIndex].flipped = true;
    setCards(updatedCards);

    // Add to flipped cards
    const newFlippedCards = [...flippedCards, id];
    setFlippedCards(newFlippedCards);

    // Check for match if two cards are flipped
    if (newFlippedCards.length === 2) {
      const firstCardIndex = cards.findIndex(card => card.id === newFlippedCards[0]);
      const secondCardIndex = cards.findIndex(card => card.id === newFlippedCards[1]);

      const firstCard = cards[firstCardIndex];
      const secondCard = cards[secondCardIndex];

      // Check if it's a valid match (symbol + meaning)
      const isMatch = 
        (firstCard.type === "symbol" && secondCard.type === "meaning" && 
         firstCard.content === "和" && secondCard.content === "Harmony") ||
        (firstCard.type === "meaning" && secondCard.type === "symbol" && 
         firstCard.content === "Harmony" && secondCard.content === "和") ||
        (firstCard.type === "symbol" && secondCard.type === "meaning" && 
         firstCard.content === "愛" && secondCard.content === "Love") ||
        (firstCard.type === "meaning" && secondCard.type === "symbol" && 
         firstCard.content === "Love" && secondCard.content === "愛") ||
        (firstCard.type === "symbol" && secondCard.type === "meaning" && 
         firstCard.content === "道" && secondCard.content === "Way/Path") ||
        (firstCard.type === "meaning" && secondCard.type === "symbol" && 
         firstCard.content === "Way/Path" && secondCard.content === "道") ||
        (firstCard.type === "symbol" && secondCard.type === "meaning" && 
         firstCard.content === "夢" && secondCard.content === "Dream") ||
        (firstCard.type === "meaning" && secondCard.type === "symbol" && 
         firstCard.content === "Dream" && secondCard.content === "夢");

      if (isMatch) {
        // It's a match
        setTimeout(() => {
          const matchedCards = [...cards];
          matchedCards[firstCardIndex].matched = true;
          matchedCards[secondCardIndex].matched = true;
          setCards(matchedCards);
          setMatchedPairs(prev => prev + 1);
          setProgress((matchedPairs + 1) * 25); // 4 pairs = 100% progress
          setFlippedCards([]);
        }, 1000);
      } else {
        // No match, flip back
        setTimeout(() => {
          const resetCards = [...cards];
          resetCards[firstCardIndex].flipped = false;
          resetCards[secondCardIndex].flipped = false;
          setCards(resetCards);
          setFlippedCards([]);
        }, 1000);
      }
    }
  };

  const resetPuzzle = () => {
    setCards(initialCards.map(card => ({ ...card, flipped: false, matched: false })));
    setFlippedCards([]);
    setMatchedPairs(0);
    setProgress(0);
  };

  return (
    <section className="py-12 bg-light">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="font-heading text-2xl md:text-3xl font-bold mb-4">Featured Puzzle: Japanese Symbols</h2>
          <p className="text-gray-600">Try out this sample puzzle to get a taste of the CultureQuest experience.</p>
        </div>
        
        <div className="bg-white rounded-xl shadow-md p-6 max-w-3xl mx-auto border border-lightgray">
          <div className="grid grid-cols-4 gap-4 mb-6">
            {cards.map(card => (
              <div
                key={card.id}
                className={`
                  aspect-square rounded-lg flex items-center justify-center cursor-pointer hover:shadow-md transition-colors
                  ${card.flipped || card.matched ? 
                    (card.type === 'symbol' ? 'bg-primary' : 'bg-lightgray') : 
                    'bg-primary/80'}
                  ${card.matched ? 'shadow-md puzzle-solved' : ''}
                `}
                onClick={() => handleCardClick(card.id)}
              >
                {(card.flipped || card.matched) && (
                  card.type === 'symbol' ? (
                    <span className="font-sans text-white text-2xl font-bold">{card.content}</span>
                  ) : (
                    <span className="font-sans text-dark text-sm font-medium px-2 text-center">{card.content}</span>
                  )
                )}
              </div>
            ))}
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm text-gray-500">Matches: <span className="font-medium">{matchedPairs}/4</span></span>
              <div className="w-32 bg-lightgray rounded-full h-2 mt-1">
                <div className="bg-primary rounded-full h-2" style={{width: `${progress}%`}}></div>
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={resetPuzzle}
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Reset</span>
              </Button>
              
              <Button asChild className="flex items-center gap-2">
                <Link href="/puzzles/1">
                  <span>Play Full Puzzle</span>
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
        
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>This is just a preview. The full puzzle includes more symbols and cultural context.</p>
        </div>
      </div>
    </section>
  );
}
