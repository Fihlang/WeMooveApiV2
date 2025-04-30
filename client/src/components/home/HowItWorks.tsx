import { Button } from "@/components/ui/button";
import { Globe, Puzzle, Trophy } from "lucide-react";
import { Link } from "wouter";

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-12 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="font-heading text-2xl md:text-3xl font-bold mb-4">How CultureQuest Works</h2>
          <p className="text-gray-600">Learn about cultures around the world through fun, interactive puzzles and games.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center mx-auto mb-4">
              <Puzzle className="text-white h-8 w-8" />
            </div>
            <h3 className="font-heading font-semibold text-xl mb-3">Solve Puzzles</h3>
            <p className="text-gray-600">Complete interactive puzzles about languages, traditions, food, art, and more from cultures around the world.</p>
          </div>
          
          <div className="text-center">
            <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
              <Trophy className="text-dark h-8 w-8" />
            </div>
            <h3 className="font-heading font-semibold text-xl mb-3">Earn Achievements</h3>
            <p className="text-gray-600">Unlock achievements as you progress through puzzles and master different cultural topics.</p>
          </div>
          
          <div className="text-center">
            <div className="w-20 h-20 rounded-full bg-accent flex items-center justify-center mx-auto mb-4">
              <Globe className="text-white h-8 w-8" />
            </div>
            <h3 className="font-heading font-semibold text-xl mb-3">Explore the World</h3>
            <p className="text-gray-600">Journey through different regions and unlock new cultural discoveries as you complete puzzles.</p>
          </div>
        </div>
        
        <div className="mt-12 text-center">
          <Button asChild size="lg" className="bg-primary hover:bg-primary/90">
            <Link href="#start-journey">
              Start Your Cultural Journey
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
