import { useQuery } from "@tanstack/react-query";
import AchievementCollection from "@/components/achievements/AchievementCollection";
import RecentAchievements from "@/components/achievements/RecentAchievements";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AchievementsPage() {
  // Use hard-coded user ID 1 for now. In a real app, this would come from authentication
  const userId = 1;
  
  const { data: achievements, isLoading: achievementsLoading } = useQuery({
    queryKey: ['/api/achievements', { userId }],
  });
  
  const { data: recentAchievements, isLoading: recentLoading } = useQuery({
    queryKey: ['/api/achievements/recent', { userId }],
  });
  
  const { data: dashboard } = useQuery({
    queryKey: ['/api/users/1/dashboard'],
  });

  if (achievementsLoading || recentLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading achievements...</div>;
  }

  if (!achievements || !recentAchievements) {
    return <div className="min-h-screen flex items-center justify-center">Failed to load achievements</div>;
  }

  // Calculate achievement statistics
  const totalAchievements = achievements.length;
  const unlockedAchievements = achievements.filter(a => a.unlockedAt).length;
  const completionPercentage = Math.floor((unlockedAchievements / totalAchievements) * 100);
  
  // Get achievement categories
  const categories = [...new Set(achievements.map(a => a.backgroundColor))];
  
  return (
    <div className="py-12 bg-gradient-to-br from-secondary/10 to-primary/10 min-h-screen">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h1 className="font-bold text-2xl md:text-3xl mb-4">Your Achievements</h1>
          <p className="text-gray-600 mb-6">Track your progress and unlock rewards as you explore different cultures.</p>
          
          <div className="bg-white rounded-xl p-6 shadow-md">
            <h2 className="font-semibold text-lg mb-4">Overall Progress</h2>
            <div className="flex justify-between mb-2">
              <span>{unlockedAchievements} of {totalAchievements} achievements unlocked</span>
              <span className="text-primary">{completionPercentage}%</span>
            </div>
            <Progress value={completionPercentage} className="h-2 mb-4" />
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className="bg-primary/10 rounded-lg p-3 text-center">
                <span className="block text-xl font-bold text-primary">{unlockedAchievements}</span>
                <span className="text-sm text-gray-600">Achievements</span>
              </div>
              
              <div className="bg-secondary/10 rounded-lg p-3 text-center">
                <span className="block text-xl font-bold text-secondary">{dashboard?.stats.puzzlesCompleted || 0}</span>
                <span className="text-sm text-gray-600">Puzzles</span>
              </div>
              
              <div className="bg-accent/10 rounded-lg p-3 text-center">
                <span className="block text-xl font-bold text-accent">42</span>
                <span className="text-sm text-gray-600">Points</span>
              </div>
              
              <div className="bg-success/10 rounded-lg p-3 text-center">
                <span className="block text-xl font-bold text-success">4</span>
                <span className="text-sm text-gray-600">Regions</span>
              </div>
            </div>
          </div>
        </div>
        
        <Tabs defaultValue="all" className="mb-8">
          <TabsList className="mx-auto mb-6 grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="all">All Achievements</TabsTrigger>
            <TabsTrigger value="recent">Recently Unlocked</TabsTrigger>
            <TabsTrigger value="locked">Locked</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all">
            <AchievementCollection achievements={achievements} showTitle={false} />
          </TabsContent>
          
          <TabsContent value="recent">
            <RecentAchievements achievements={recentAchievements} showTitle={false} />
          </TabsContent>
          
          <TabsContent value="locked">
            <div className="bg-white rounded-xl shadow-md overflow-hidden border border-lightgray">
              <div className="p-6 border-b border-lightgray">
                <h3 className="font-semibold text-xl">Locked Achievements</h3>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {achievements
                    .filter(a => !a.unlockedAt)
                    .map(achievement => (
                      <div key={achievement.id} className="flex flex-col items-center">
                        <div className={`w-16 h-16 mb-2 rounded-full bg-lightgray flex items-center justify-center`}>
                          <i className={`fas ${achievement.icon} text-gray-400 text-2xl`}></i>
                        </div>
                        <h4 className="font-medium text-sm text-center text-gray-400">{achievement.title}</h4>
                        <p className="text-xs text-gray-400 text-center">{achievement.description}</p>
                      </div>
                    ))
                  }
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        <div className="bg-white rounded-xl shadow-md overflow-hidden border border-lightgray mb-8">
          <div className="p-6 border-b border-lightgray">
            <h3 className="font-semibold text-xl">Achievement Categories</h3>
          </div>
          
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category, index) => {
              const categoryAchievements = achievements.filter(a => a.backgroundColor === category);
              const unlocked = categoryAchievements.filter(a => a.unlockedAt).length;
              const total = categoryAchievements.length;
              const percent = Math.floor((unlocked / total) * 100);
              
              return (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center mb-3">
                    <div className={`w-10 h-10 rounded-full bg-${category} flex items-center justify-center mr-3`}>
                      <i className={`fas ${categoryAchievements[0]?.icon || 'fa-award'} ${category === 'lightgray' ? 'text-gray-500' : 'text-white'}`}></i>
                    </div>
                    <div>
                      <h4 className="font-medium">{categoryAchievements[0]?.title.split(' ')[0] || 'Category'} Achievements</h4>
                      <p className="text-sm text-gray-500">{unlocked} of {total} unlocked</p>
                    </div>
                  </div>
                  <Progress value={percent} className="h-2" />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
