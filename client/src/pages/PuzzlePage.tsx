import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useEffect, useState } from "react";
import { PuzzleCard } from "@/lib/types";
import { apiRequest } from "@/lib/queryClient";

export default function PuzzlePage({ id }: { id?: number }) {
  const params = useParams();
  const puzzleId = id || parseInt(params.id);
  const userId = 1; // In a real app, this would come from authentication

  const { data: puzzle, isLoading } = useQuery({
    queryKey: ['/api/puzzles/' + puzzleId, { userId }],
  });

  const [cards, setCards] = useState<PuzzleCard[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [matchedCards, setMatchedCards] = useState<number[]>([]);
  const [progress, setProgress] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  // Initialize cards when puzzle data is loaded
  useEffect(() => {
    if (puzzle?.content?.cards) {
      const puzzleCards = puzzle.content.cards;
      // Create card pairs for memory game
      const initialCards: PuzzleCard[] = [];
      
      // Add symbol cards
      puzzleCards.forEach((card: { symbol: string; meaning: string }) => {
        initialCards.push({
          symbol: card.symbol,
          meaning: "",
          flipped: false,
          matched: false
        });
      });
      
      // Add meaning cards
      puzzleCards.forEach((card: { symbol: string; meaning: string }) => {
        initialCards.push({
          symbol: "",
          meaning: card.meaning,
          flipped: false,
          matched: false
        });
      });
      
      // Shuffle cards
      const shuffledCards = [...initialCards].sort(() => Math.random() - 0.5);
      setCards(shuffledCards);
      
      // Set initial progress
      setProgress(puzzle.progress || 0);
      setIsCompleted(puzzle.completed || false);
    }
  }, [puzzle]);

  const handleCardClick = (index: number) => {
    // Ignore if card is already flipped or matched
    if (cards[index].flipped || matchedCards.includes(index)) {
      return;
    }
    
    // Ignore if two cards are already flipped
    if (flippedCards.length === 2) {
      return;
    }
    
    // Flip card
    const updatedCards = [...cards];
    updatedCards[index].flipped = true;
    setCards(updatedCards);
    
    // Add to flipped cards
    const newFlippedCards = [...flippedCards, index];
    setFlippedCards(newFlippedCards);
    
    // Check for match if two cards are flipped
    if (newFlippedCards.length === 2) {
      const [first, second] = newFlippedCards;
      
      // Check if symbols and meanings match
      if (
        (cards[first].symbol && cards[second].meaning && 
          puzzle?.content?.cards.some((card: { symbol: string; meaning: string }) => 
            card.symbol === cards[first].symbol && card.meaning === cards[second].meaning
          )
        ) ||
        (cards[second].symbol && cards[first].meaning && 
          puzzle?.content?.cards.some((card: { symbol: string; meaning: string }) => 
            card.symbol === cards[second].symbol && card.meaning === cards[first].meaning
          )
        )
      ) {
        // Match found
        setTimeout(() => {
          const updatedCards = [...cards];
          updatedCards[first].matched = true;
          updatedCards[second].matched = true;
          setCards(updatedCards);
          setMatchedCards([...matchedCards, first, second]);
          setFlippedCards([]);
          
          // Update progress
          const totalPairs = puzzle?.content?.cards.length || 0;
          const newMatchCount = (matchedCards.length + 2) / 2;
          const newProgress = Math.floor((newMatchCount / totalPairs) * 100);
          setProgress(newProgress);
          
          // Check if puzzle is completed
          if (newMatchCount === totalPairs) {
            setIsCompleted(true);
            savePuzzleProgress(newProgress, true);
          } else {
            savePuzzleProgress(newProgress, false);
          }
        }, 1000);
      } else {
        // No match
        setTimeout(() => {
          const updatedCards = [...cards];
          updatedCards[first].flipped = false;
          updatedCards[second].flipped = false;
          setCards(updatedCards);
          setFlippedCards([]);
        }, 1000);
      }
    }
  };

  const resetPuzzle = () => {
    // Reset cards
    const resetCards = cards.map(card => ({
      ...card,
      flipped: false,
      matched: false
    }));
    setCards(resetCards);
    setFlippedCards([]);
    setMatchedCards([]);
    setProgress(0);
    setIsCompleted(false);
    
    // Shuffle cards
    setTimeout(() => {
      const shuffledCards = [...resetCards].sort(() => Math.random() - 0.5);
      setCards(shuffledCards);
    }, 300);
    
    // Reset progress in database
    savePuzzleProgress(0, false);
  };

  const savePuzzleProgress = async (progress: number, completed: boolean) => {
    try {
      await apiRequest(
        "POST", 
        `/api/users/${userId}/puzzles/${puzzleId}/progress`, 
        { progress, completed }
      );
    } catch (error) {
      console.error("Failed to save progress:", error);
    }
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading puzzle...</div>;
  }

  if (!puzzle) {
    return <div className="min-h-screen flex items-center justify-center">Puzzle not found</div>;
  }

  return (
    <div className="py-12 bg-light min-h-screen">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-block bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium mb-2">
            {puzzle.type} • {puzzle.difficulty}
          </div>
          <h1 className="font-bold text-2xl md:text-3xl mb-3">{puzzle.title}</h1>
          <p className="text-gray-600">{puzzle.description}</p>
        </div>
        
        <Card className="max-w-3xl mx-auto mb-8">
          <CardContent className="p-6">
            {/* Puzzle Grid */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              {cards.map((card, index) => (
                <div
                  key={index}
                  className={`
                    aspect-square rounded-lg flex items-center justify-center cursor-pointer shadow-sm
                    transition-all duration-300 transform
                    ${card.flipped || card.matched ? 
                      (card.symbol ? 'bg-primary' : 'bg-lightgray') : 
                      'bg-primary-dark'}
                    ${card.matched ? 'puzzle-solved' : ''}
                  `}
                  onClick={() => handleCardClick(index)}
                >
                  {(card.flipped || card.matched) && (
                    card.symbol ? (
                      <span className="font-sans text-white text-2xl font-bold">{card.symbol}</span>
                    ) : (
                      <span className="font-sans text-dark text-sm font-medium px-2 text-center">{card.meaning}</span>
                    )
                  )}
                </div>
              ))}
            </div>
            
            {/* Puzzle Controls */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-sm text-gray-500">
                  Matches: <span className="font-medium">{matchedCards.length / 2} of {puzzle.content.cards.length}</span>
                </span>
                <Progress value={progress} className="w-32 h-2" />
              </div>
              
              <div className="flex gap-3">
                <Button variant="outline" onClick={resetPuzzle}>
                  <span className="mr-1">Reset</span>
                </Button>
                {isCompleted ? (
                  <Button className="bg-success hover:bg-success/90">
                    <span className="mr-1">Completed!</span>
                  </Button>
                ) : (
                  <Button>
                    <span>Continue</span>
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Additional information */}
        <div className="max-w-3xl mx-auto">
          <h2 className="font-semibold text-xl mb-4">About this puzzle</h2>
          <p className="text-gray-600 mb-6">
            This puzzle helps you learn about {puzzle.type.toLowerCase()} from the {puzzle.regionId === 1 ? 'East Asia' : 'selected'} region. 
            Match the symbols with their meanings to complete the puzzle.
          </p>
          
          <div className="bg-white p-4 rounded-lg border border-lightgray">
            <h3 className="font-medium mb-2">Achievements you can earn:</h3>
            <ul className="space-y-2">
              {Array.from({ length: puzzle.achievementCount }).map((_, i) => (
                <li key={i} className="flex items-center">
                  <span className="w-6 h-6 bg-success/20 rounded-full flex items-center justify-center text-success mr-2">
                    <i className="fas fa-gem"></i>
                  </span>
                  <span className="text-sm">Complete the puzzle to unlock</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
