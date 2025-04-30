import { Progress } from "@/components/ui/progress";
import { Check } from "lucide-react";
import PuzzleCard from "@/components/ui/PuzzleCard";
import { PuzzleWithProgress } from "@shared/schema";
import { Link } from "wouter";

interface ContinueJourneyProps {
  puzzles: PuzzleWithProgress[];
}

export default function ContinueJourney({ puzzles }: ContinueJourneyProps) {
  // Calculate journey progress
  const completedPuzzles = puzzles.filter(puzzle => puzzle.completed).length;
  const totalPuzzles = puzzles.length;
  const remainingPuzzles = totalPuzzles - completedPuzzles;
  const progressPercentage = Math.floor((completedPuzzles / totalPuzzles) * 100);
  
  // Count earned achievements
  const earnedAchievements = puzzles
    .filter(puzzle => puzzle.completed)
    .reduce((sum, puzzle) => sum + puzzle.achievementCount, 0);

  return (
    <section id="start-journey" className="py-12 bg-light">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="md:w-1/3">
            <h2 className="font-heading text-2xl md:text-3xl font-bold mb-4">Continue Your Journey</h2>
            <p className="text-gray-600 mb-6">You're exploring East Asia! Continue your cultural adventure with these puzzles.</p>
            
            <div className="bg-white p-6 rounded-xl shadow-md border border-lightgray mb-6">
              <h3 className="font-heading font-semibold text-lg mb-4">Your Progress</h3>
              <div className="mb-4">
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">East Asia Journey</span>
                  <span className="text-sm font-medium text-primary">{progressPercentage}%</span>
                </div>
                <Progress value={progressPercentage} className="h-2" />
              </div>
              
              <div className="flex justify-between items-center text-sm">
                <span>{remainingPuzzles} puzzles remaining</span>
                <span className="text-success font-medium">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                  </svg>
                  {earnedAchievements} achievements earned
                </span>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-md border border-lightgray">
              <h3 className="font-heading font-semibold text-lg mb-3">Regional Mastery</h3>
              <p className="text-sm text-gray-600 mb-4">Complete all puzzles to earn the East Asia Master badge!</p>
              
              <div className="flex gap-2">
                {puzzles.map((_, index) => (
                  <div 
                    key={index}
                    className={`
                      w-12 h-12 rounded-full flex items-center justify-center
                      ${index < completedPuzzles ? 'bg-primary/20' : 'bg-primary/10'}
                    `}
                  >
                    {index < completedPuzzles ? (
                      <Check className="text-primary h-5 w-5" />
                    ) : (
                      <span className={`${index < completedPuzzles ? 'text-primary' : 'text-primary/60'} font-medium`}>
                        {index + 1}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="md:w-2/3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {puzzles.map(puzzle => (
                <Link key={puzzle.id} href={`/puzzles/${puzzle.id}`}>
                  <a className="block">
                    <PuzzleCard puzzle={puzzle} />
                  </a>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
