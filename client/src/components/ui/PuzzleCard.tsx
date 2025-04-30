import { PuzzleWithProgress } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Clock, ChevronRight, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PuzzleCardProps {
  puzzle: PuzzleWithProgress;
}

export default function PuzzleCard({ puzzle }: PuzzleCardProps) {
  // Map puzzle type to appropriate badge styling
  const getTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'culture': return 'bg-secondary/20 text-dark';
      case 'language': return 'bg-info/20 text-info';
      case 'tradition': return 'bg-accent/20 text-accent';
      case 'festivals': return 'bg-primary/20 text-primary';
      default: return 'bg-primary/20 text-primary';
    }
  };

  return (
    <Card className="overflow-hidden border border-lightgray hover:shadow-lg transition-shadow h-full">
      <div className="relative">
        <img 
          className="h-48 w-full object-cover" 
          src={puzzle.imageUrl || "https://images.unsplash.com/photo-1480796927426-f609979314bd?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80"} 
          alt={puzzle.title}
        />
        <div className="absolute top-3 right-3 bg-white bg-opacity-90 rounded-full px-3 py-1 text-xs font-medium text-primary flex items-center">
          <Star className="h-3 w-3 mr-1" />
          {puzzle.difficulty}
        </div>
        
        {puzzle.isNew && (
          <div className="absolute top-3 left-3 bg-secondary text-dark font-medium text-xs px-2 py-1 rounded-lg flex items-center">
            <Clock className="h-3 w-3 mr-1" />
            New
          </div>
        )}

        {puzzle.completed && (
          <div className="absolute top-3 left-3 bg-success text-white font-medium text-xs px-2 py-1 rounded-lg">
            Completed
          </div>
        )}
      </div>
      
      <div className="p-5">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-heading font-semibold text-lg">{puzzle.title}</h3>
          <Badge className={getTypeColor(puzzle.type)} variant="outline">
            {puzzle.type}
          </Badge>
        </div>
        
        <p className="text-gray-600 text-sm mb-4">{puzzle.description}</p>
        
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <div className="w-6 h-6 flex items-center justify-center rounded-full bg-success bg-opacity-20 text-success text-xs">
              <i className="fas fa-gem"></i>
            </div>
            <span className="ml-1 text-xs text-gray-500">
              Earn {puzzle.achievementCount} {puzzle.achievementCount === 1 ? 'achievement' : 'achievements'}
            </span>
          </div>
          
          <Button size="sm" className="flex items-center gap-1">
            <span>{puzzle.progress > 0 && !puzzle.completed ? 'Continue' : 'Play Now'}</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
