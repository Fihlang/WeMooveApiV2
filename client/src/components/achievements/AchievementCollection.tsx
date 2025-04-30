import { AchievementWithStatus } from "@shared/schema";
import AchievementBadge from "@/components/ui/AchievementBadge";

interface AchievementCollectionProps {
  achievements: AchievementWithStatus[];
  showTitle?: boolean;
}

export default function AchievementCollection({ 
  achievements, 
  showTitle = true 
}: AchievementCollectionProps) {
  // Count unlocked achievements
  const unlockedCount = achievements.filter(achievement => !achievement.isLocked || achievement.unlockedAt).length;
  const totalCount = achievements.length;

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden border border-lightgray mb-8">
      {showTitle && (
        <div className="p-6 border-b border-lightgray">
          <div className="flex justify-between items-center">
            <h3 className="font-heading font-semibold text-xl">Achievement Collection</h3>
            <span className="text-sm text-primary font-medium">{unlockedCount} of {totalCount} Unlocked</span>
          </div>
        </div>
      )}
      
      <div className="p-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {achievements.map(achievement => (
            <AchievementBadge 
              key={achievement.id}
              id={achievement.id}
              title={achievement.title}
              description={achievement.description}
              icon={achievement.icon}
              backgroundColor={achievement.backgroundColor}
              isLocked={achievement.isLocked && !achievement.unlockedAt}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
