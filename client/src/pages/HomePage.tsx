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
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Truck, PackageOpen, MapPin, Clock } from "lucide-react";

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
      {/* Furniture Delivery App Promotion */}
      <section className="bg-primary text-white py-24 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h1 className="text-4xl md:text-5xl font-bold">
                Move Your Furniture <br />With Just a Few Clicks
              </h1>
              <p className="text-lg opacity-90">
                The easiest way to deliver furniture. Connect with nearby drivers, track your delivery in real-time, and get your items safely to their destination.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button
                  size="lg"
                  className="bg-white text-primary hover:bg-white/90"
                  asChild
                >
                  <Link href="/delivery/dashboard">
                    <Truck className="mr-2 h-5 w-5" />
                    Go to Dashboard
                  </Link>
                </Button>
              </div>
              
              <div className="flex flex-wrap gap-6 pt-6">
                <div className="flex items-center gap-2">
                  <div className="bg-white/20 p-2 rounded-full">
                    <PackageOpen className="h-5 w-5" />
                  </div>
                  <span>Easy Booking</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="bg-white/20 p-2 rounded-full">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <span>Live Tracking</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="bg-white/20 p-2 rounded-full">
                    <Clock className="h-5 w-5" />
                  </div>
                  <span>Fast Delivery</span>
                </div>
              </div>
            </div>
            
            <div className="bg-white/10 rounded-2xl p-6 relative">
              <div className="absolute -top-3 -right-3 bg-white text-primary rounded-full px-4 py-1 font-bold text-sm">
                New!
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold">Recent Deliveries</h3>
                  <span className="text-xs bg-white/20 px-2 py-1 rounded-full">Last 24h</span>
                </div>
                
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-white/5 rounded-lg p-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="bg-white/10 h-10 w-10 rounded-full flex items-center justify-center">
                          <PackageOpen className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-medium">Delivery #{i + 1000}</p>
                          <p className="text-sm opacity-70">2 items • 3.2 miles</p>
                        </div>
                      </div>
                      <span className="text-sm font-medium bg-green-500/20 px-2 py-1 rounded">Completed</span>
                    </div>
                  ))}
                </div>
                
                <Button variant="outline" className="w-full border-white/20 hover:bg-white/10 mt-2" asChild>
                  <Link href="/delivery/dashboard">
                    View All Deliveries
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Original CultureQuest content */}
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
