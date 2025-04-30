interface AchievementBadgeProps {
  id: number;
  title: string;
  description: string;
  icon: string;
  backgroundColor: string;
  isLocked: boolean;
}

export default function AchievementBadge({
  id,
  title,
  description,
  icon,
  backgroundColor,
  isLocked
}: AchievementBadgeProps) {
  return (
    <div className="flex flex-col items-center">
      <div 
        className={`
          w-16 h-16 mb-2 rounded-full flex items-center justify-center shadow-md
          ${isLocked ? 'bg-lightgray' : `bg-${backgroundColor}`}
        `}
      >
        <i 
          className={`
            fas ${icon} text-2xl
            ${isLocked ? 'text-gray-400' : (backgroundColor === 'lightgray' ? 'text-gray-700' : 'text-white')}
          `}
        ></i>
      </div>
      <h4 
        className={`
          font-heading font-medium text-sm text-center
          ${isLocked ? 'text-gray-400' : ''}
        `}
      >
        {title}
      </h4>
      <p 
        className={`
          text-xs text-center
          ${isLocked ? 'text-gray-400' : 'text-gray-500'}
        `}
      >
        {description}
      </p>
    </div>
  );
}
