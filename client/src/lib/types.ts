// Client-side types that extend backend types

export interface UserStats {
  currentJourney: string;
  achievementsUnlocked: string;
  puzzlesCompleted: number;
  culturesDiscovered: string;
}

export interface Dashboard {
  user: {
    id: number;
    username: string;
    displayName: string;
    avatarUrl?: string;
    currentJourneyId?: number;
  };
  stats: UserStats;
}

export interface PuzzleCard {
  symbol: string;
  meaning: string;
  flipped: boolean;
  matched: boolean;
}

export interface TimeInfo {
  relative: string;
  date: Date;
}

export function getRelativeTime(date: Date): TimeInfo {
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  let relative = '';
  if (diffInDays === 0) {
    relative = 'Today';
  } else if (diffInDays === 1) {
    relative = 'Yesterday';
  } else if (diffInDays < 7) {
    relative = `${diffInDays} days ago`;
  } else if (diffInDays < 14) {
    relative = '1 week ago';
  } else if (diffInDays < 30) {
    relative = `${Math.floor(diffInDays / 7)} weeks ago`;
  } else if (diffInDays < 60) {
    relative = '1 month ago';
  } else {
    relative = `${Math.floor(diffInDays / 30)} months ago`;
  }

  return { relative, date };
}
