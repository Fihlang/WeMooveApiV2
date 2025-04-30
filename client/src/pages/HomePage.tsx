import { useQuery } from "@tanstack/react-query";
import Hero from "@/components/home/Hero";
import PlayerStats from "@/components/home/PlayerStats";
import ContinueJourney from "@/components/home/ContinueJourney";
import CulturalMap from "@/components/home/CulturalMap";
import HowItWorks from "@/components/home/HowItWorks";
import PuzzlePreview from "@/components/home/PuzzlePreview";
import { Dashboard } from "@/lib/types";
import AchievementCollection from "@/components/achievements/AchievementCollection";
import RecentAchievements from "@/components/achievements/RecentAchievements";
import NewAchievementPopup from "@/components/ui/NewAchievementPopup";
import { useState, useEffect } from "react";

export default function HomePage() {
  // Use hard-coded user ID 1 for now. In a real app, this would come from authentication
  const userId = 1;
  
  const { data: dashboard, isLoading } = useQuery<Dashboard>({
    queryKey: ['/api/users/1/dashboard'],
  });

  const { data: puzzles } = useQuery({
    queryKey: ['/api/puzzles', { regionId: 1, userId }],
  });

  const { data: regions } = useQuery({
    queryKey: ['/api/regions', { userId }],
  });

  const { data: achievements } = useQuery({
    queryKey: ['/api/achievements', { userId }],
  });

  const { data: recentAchievements } = useQuery({
    queryKey: ['/api/achievements/recent', { userId }],
  });

  // Show achievement popup after 3 seconds
  const [showAchievement, setShowAchievement] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowAchievement(true);
    }, 3000);
    
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div>
      <Hero />
      
      {dashboard && (
        <PlayerStats 
          currentJourney={dashboard.stats.currentJourney} 
          achievements={dashboard.stats.achievementsUnlocked}
          puzzlesCompleted={dashboard.stats.puzzlesCompleted}
          culturesDiscovered={dashboard.stats.culturesDiscovered}
        />
      )}
      
      {puzzles && (
        <ContinueJourney puzzles={puzzles} />
      )}
      
      {regions && (
        <CulturalMap regions={regions} />
      )}
      
      <section className="py-12 bg-gradient-to-br from-secondary/10 to-primary/10">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="font-bold text-2xl md:text-3xl mb-4">Your Achievements</h2>
            <p className="text-gray-600">Track your progress and unlock rewards as you explore different cultures.</p>
          </div>
          
          {achievements && (
            <AchievementCollection achievements={achievements} />
          )}
          
          {recentAchievements && (
            <RecentAchievements achievements={recentAchievements} />
          )}
        </div>
      </section>
      
      <HowItWorks />
      <PuzzlePreview />
      
      {showAchievement && (
        <NewAchievementPopup 
          title="Cultural Curious" 
          description="You've unlocked 'Cultural Curious' for viewing your first puzzle!"
          icon="fa-crown"
          color="secondary"
          onClose={() => setShowAchievement(false)}
        />
      )}
    </div>
  );
}
