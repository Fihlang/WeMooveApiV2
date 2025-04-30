import { Globe, MapPin, Puzzle, Trophy } from "lucide-react";

interface PlayerStatsProps {
  currentJourney: string;
  achievements: string;
  puzzlesCompleted: number;
  culturesDiscovered: string;
}

export default function PlayerStats({ 
  currentJourney, 
  achievements, 
  puzzlesCompleted, 
  culturesDiscovered 
}: PlayerStatsProps) {
  return (
    <section className="bg-white border-b">
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center">
            <div className="w-14 h-14 rounded-lg bg-primary flex items-center justify-center mr-3">
              <MapPin className="text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Current Journey</p>
              <h3 className="font-heading font-semibold">{currentJourney}</h3>
            </div>
          </div>
          
          <div className="flex items-center">
            <div className="w-14 h-14 rounded-lg bg-secondary flex items-center justify-center mr-3">
              <Trophy className="text-dark" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Achievements</p>
              <h3 className="font-heading font-semibold">{achievements}</h3>
            </div>
          </div>
          
          <div className="flex items-center">
            <div className="w-14 h-14 rounded-lg bg-accent flex items-center justify-center mr-3">
              <Puzzle className="text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Puzzles Completed</p>
              <h3 className="font-heading font-semibold">{puzzlesCompleted}</h3>
            </div>
          </div>
          
          <div className="flex items-center">
            <div className="w-14 h-14 rounded-lg bg-light border flex items-center justify-center mr-3">
              <Globe className="text-info" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Cultures Discovered</p>
              <h3 className="font-heading font-semibold">{culturesDiscovered}</h3>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
