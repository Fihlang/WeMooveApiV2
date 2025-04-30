import { AchievementWithStatus } from "@shared/schema";
import { getRelativeTime } from "@/lib/types";

interface RecentAchievementsProps {
  achievements: (AchievementWithStatus & { unlockedAt: Date })[];
  showTitle?: boolean;
}

export default function RecentAchievements({ 
  achievements, 
  showTitle = true 
}: RecentAchievementsProps) {
  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden border border-lightgray">
      {showTitle && (
        <div className="p-6 border-b border-lightgray">
          <h3 className="font-heading font-semibold text-xl">Recently Unlocked</h3>
        </div>
      )}
      
      <div className="divide-y divide-lightgray">
        {achievements.length > 0 ? (
          achievements.map(achievement => {
            const timeInfo = getRelativeTime(new Date(achievement.unlockedAt));
            
            return (
              <div key={achievement.id} className="p-4 hover:bg-light transition-colors flex items-center">
                <div className={`w-12 h-12 rounded-full bg-${achievement.backgroundColor} flex items-center justify-center mr-4`}>
                  <i className={`fas ${achievement.icon} ${achievement.backgroundColor === 'lightgray' ? 'text-gray-700' : 'text-white'}`}></i>
                </div>
                
                <div className="flex-grow">
                  <h4 className="font-heading font-medium">{achievement.title}</h4>
                  <p className="text-sm text-gray-500">{achievement.description}</p>
                </div>
                
                <div className="text-right">
                  <span className="text-xs text-gray-500">{timeInfo.relative}</span>
                  <div className="text-xs bg-success bg-opacity-20 text-success rounded-full px-2 py-1 inline-block mt-1">
                    <i className="fas fa-plus mr-1"></i> {achievement.points} points
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-8 text-center text-gray-500">
            <p>No achievements unlocked yet. Start solving puzzles to earn achievements!</p>
          </div>
        )}
      </div>
    </div>
  );
}
