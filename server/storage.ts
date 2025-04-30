import { 
  Achievement, 
  AchievementWithStatus, 
  InsertAchievement, 
  InsertPuzzle, 
  InsertRegion, 
  InsertUser, 
  InsertUserAchievement, 
  InsertUserPuzzle, 
  InsertUserRegion, 
  Puzzle, 
  PuzzleWithProgress,
  Region, 
  RegionWithProgress, 
  User, 
  UserAchievement,
  UserPuzzle,
  UserRegion
} from "@shared/schema";

// Interface for all storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getUserDashboard(userId: number): Promise<{
    user: User;
    stats: {
      currentJourney: string;
      achievementsUnlocked: string;
      puzzlesCompleted: number;
      culturesDiscovered: string;
    };
  }>;

  // Region operations
  getAllRegions(): Promise<Region[]>;
  getRegion(id: number): Promise<Region | undefined>;
  createRegion(region: InsertRegion): Promise<Region>;
  getRegionsWithProgressForUser(userId: number): Promise<RegionWithProgress[]>;
  getRegionWithProgressForUser(regionId: number, userId: number): Promise<RegionWithProgress | undefined>;

  // Puzzle operations
  getAllPuzzles(userId?: number): Promise<PuzzleWithProgress[]>;
  getPuzzle(id: number): Promise<Puzzle | undefined>;
  createPuzzle(puzzle: InsertPuzzle): Promise<Puzzle>;
  getPuzzlesByRegion(regionId: number, userId?: number): Promise<PuzzleWithProgress[]>;
  getPuzzleWithProgressForUser(puzzleId: number, userId: number): Promise<PuzzleWithProgress | undefined>;
  updateUserPuzzleProgress(userPuzzle: InsertUserPuzzle): Promise<UserPuzzle>;

  // Achievement operations
  getAllAchievements(): Promise<Achievement[]>;
  getAchievementsForUser(userId: number): Promise<AchievementWithStatus[]>;
  getRecentAchievementsForUser(userId: number): Promise<(AchievementWithStatus & { unlockedAt: Date })[]>;
  createAchievement(achievement: InsertAchievement): Promise<Achievement>;
  unlockAchievement(userAchievement: InsertUserAchievement): Promise<UserAchievement>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private regions: Map<number, Region>;
  private puzzles: Map<number, Puzzle>;
  private achievements: Map<number, Achievement>;
  private userAchievements: Map<number, UserAchievement>;
  private userPuzzles: Map<number, UserPuzzle>;
  private userRegions: Map<number, UserRegion>;

  private currentUserId: number;
  private currentRegionId: number;
  private currentPuzzleId: number;
  private currentAchievementId: number;
  private currentUserAchievementId: number;
  private currentUserPuzzleId: number;
  private currentUserRegionId: number;

  constructor() {
    this.users = new Map();
    this.regions = new Map();
    this.puzzles = new Map();
    this.achievements = new Map();
    this.userAchievements = new Map();
    this.userPuzzles = new Map();
    this.userRegions = new Map();

    this.currentUserId = 1;
    this.currentRegionId = 1;
    this.currentPuzzleId = 1;
    this.currentAchievementId = 1;
    this.currentUserAchievementId = 1;
    this.currentUserPuzzleId = 1;
    this.currentUserRegionId = 1;

    // Initialize with sample data
    this.initializeSampleData();
  }

  private initializeSampleData() {
    // Create a sample user
    const user: User = {
      id: this.currentUserId++,
      username: "maya",
      password: "password123", // In a real app, this would be hashed
      displayName: "Maya",
      avatarUrl: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=80",
      currentJourneyId: 1,
      createdAt: new Date()
    };
    this.users.set(user.id, user);

    // Create sample regions
    const regions: Region[] = [
      {
        id: this.currentRegionId++,
        name: "East Asia",
        description: "Discover the rich traditions of Japan, Korea, China and more in this region.",
        isLocked: false,
        mapPosition: { top: "30%", left: "75%" },
        color: "primary"
      },
      {
        id: this.currentRegionId++,
        name: "North America",
        description: "Explore the diverse cultures of the United States, Canada, and Mexico.",
        isLocked: false,
        mapPosition: { top: "35%", left: "20%" },
        color: "secondary"
      },
      {
        id: this.currentRegionId++,
        name: "Europe",
        description: "Discover the historical traditions and customs across European countries.",
        isLocked: false,
        mapPosition: { top: "30%", left: "45%" },
        color: "info"
      },
      {
        id: this.currentRegionId++,
        name: "Africa",
        description: "Explore the rich cultural heritage of the African continent.",
        isLocked: false,
        mapPosition: { top: "50%", left: "48%" },
        color: "accent"
      },
      {
        id: this.currentRegionId++,
        name: "Oceania",
        description: "Discover the indigenous cultures of Australia, New Zealand and Pacific islands.",
        isLocked: true,
        mapPosition: { top: "55%", left: "62%" },
        color: "lightgray"
      }
    ];
    
    regions.forEach(region => this.regions.set(region.id, region));

    // Create sample puzzles
    const puzzles: Puzzle[] = [
      {
        id: this.currentPuzzleId++,
        title: "Japanese Symbols Puzzle",
        description: "Match traditional Japanese symbols with their meanings in this memory game.",
        regionId: 1, // East Asia
        difficulty: "Medium",
        type: "Culture",
        content: {
          cards: [
            { symbol: "和", meaning: "Harmony" },
            { symbol: "愛", meaning: "Love" },
            { symbol: "道", meaning: "Way/Path" },
            { symbol: "夢", meaning: "Dream" }
          ]
        },
        imageUrl: "https://images.unsplash.com/photo-1480796927426-f609979314bd?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80",
        isNew: false,
        achievementCount: 2
      },
      {
        id: this.currentPuzzleId++,
        title: "Korean Alphabet Challenge",
        description: "Master the basics of Hangul with this interactive puzzle game.",
        regionId: 1, // East Asia
        difficulty: "Hard",
        type: "Language",
        content: {
          letters: [
            { symbol: "ㄱ", romanization: "g/k" },
            { symbol: "ㄴ", romanization: "n" },
            { symbol: "ㄷ", romanization: "d/t" }
          ]
        },
        imageUrl: "https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80",
        isNew: false,
        achievementCount: 3
      },
      {
        id: this.currentPuzzleId++,
        title: "Chinese Tea Ceremony",
        description: "Arrange the steps of the traditional Chinese tea ceremony in correct order.",
        regionId: 1, // East Asia
        difficulty: "Easy",
        type: "Tradition",
        content: {
          steps: [
            "Warm the teapot and cups",
            "Add tea leaves to pot",
            "Pour hot water over leaves",
            "Serve tea to guests"
          ]
        },
        imageUrl: "https://images.unsplash.com/photo-1517309230475-6736d926b979?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80",
        isNew: false,
        achievementCount: 1
      },
      {
        id: this.currentPuzzleId++,
        title: "Festival Match-Up",
        description: "Match East Asian festivals with their traditions in this fun quiz game.",
        regionId: 1, // East Asia
        difficulty: "Medium",
        type: "Festivals",
        content: {
          festivals: [
            { name: "Chinese New Year", tradition: "Red envelopes with money" },
            { name: "Diwali", tradition: "Festival of lights" }
          ]
        },
        imageUrl: "https://images.unsplash.com/photo-1528164344705-47542687000d?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80",
        isNew: true,
        achievementCount: 2
      }
    ];
    
    puzzles.forEach(puzzle => this.puzzles.set(puzzle.id, puzzle));

    // Create sample achievements
    const achievements: Achievement[] = [
      {
        id: this.currentAchievementId++,
        title: "Food Explorer",
        description: "Completed 5 food-related puzzles",
        icon: "fa-utensils",
        backgroundColor: "primary",
        isLocked: false,
        points: 150
      },
      {
        id: this.currentAchievementId++,
        title: "History Buff",
        description: "Completed all history puzzles in Asia",
        icon: "fa-landmark",
        backgroundColor: "secondary",
        isLocked: false,
        points: 200
      },
      {
        id: this.currentAchievementId++,
        title: "Music Maestro",
        description: "Matched all musical instruments correctly",
        icon: "fa-music",
        backgroundColor: "accent",
        isLocked: false,
        points: 175
      },
      {
        id: this.currentAchievementId++,
        title: "Polyglot",
        description: "Learned basics of 3 different languages",
        icon: "fa-language",
        backgroundColor: "info",
        isLocked: false,
        points: 250
      },
      {
        id: this.currentAchievementId++,
        title: "Art Connoisseur",
        description: "Completed all art-related puzzles",
        icon: "fa-mask",
        backgroundColor: "lightgray",
        isLocked: true,
        points: 300
      },
      {
        id: this.currentAchievementId++,
        title: "Culinary Expert",
        description: "Identified all traditional dishes correctly",
        icon: "fa-drumstick-bite",
        backgroundColor: "lightgray",
        isLocked: true,
        points: 225
      }
    ];
    
    achievements.forEach(achievement => this.achievements.set(achievement.id, achievement));

    // Create sample user achievements (unlocked achievements for the user)
    const userAchievements: UserAchievement[] = [
      {
        id: this.currentUserAchievementId++,
        userId: 1,
        achievementId: 1,
        unlockedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
      },
      {
        id: this.currentUserAchievementId++,
        userId: 1,
        achievementId: 2,
        unlockedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000) // 4 days ago
      },
      {
        id: this.currentUserAchievementId++,
        userId: 1,
        achievementId: 3,
        unlockedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 1 week ago
      }
    ];
    
    userAchievements.forEach(ua => this.userAchievements.set(ua.id, ua));

    // Create sample user puzzle progress
    const userPuzzles: UserPuzzle[] = [
      {
        id: this.currentUserPuzzleId++,
        userId: 1,
        puzzleId: 1,
        completed: true,
        progress: 100,
        lastPlayedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
      },
      {
        id: this.currentUserPuzzleId++,
        userId: 1,
        puzzleId: 2,
        completed: true,
        progress: 100,
        lastPlayedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
      },
      {
        id: this.currentUserPuzzleId++,
        userId: 1,
        puzzleId: 3,
        completed: false,
        progress: 75,
        lastPlayedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
      }
    ];
    
    userPuzzles.forEach(up => this.userPuzzles.set(up.id, up));

    // Create sample user region progress
    const userRegions: UserRegion[] = [
      {
        id: this.currentUserRegionId++,
        userId: 1,
        regionId: 1, // East Asia
        completionPercentage: 68,
        unlockedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      },
      {
        id: this.currentUserRegionId++,
        userId: 1,
        regionId: 2, // North America
        completionPercentage: 42,
        unlockedAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000)
      },
      {
        id: this.currentUserRegionId++,
        userId: 1,
        regionId: 3, // Europe
        completionPercentage: 51,
        unlockedAt: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000)
      },
      {
        id: this.currentUserRegionId++,
        userId: 1,
        regionId: 4, // Africa
        completionPercentage: 27,
        unlockedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)
      }
    ];
    
    userRegions.forEach(ur => this.userRegions.set(ur.id, ur));
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async createUser(userData: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...userData, id, createdAt: new Date() };
    this.users.set(id, user);
    return user;
  }

  async getUserDashboard(userId: number): Promise<{
    user: User;
    stats: {
      currentJourney: string;
      achievementsUnlocked: string;
      puzzlesCompleted: number;
      culturesDiscovered: string;
    };
  }> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Get current journey (region)
    let currentJourney = "None";
    if (user.currentJourneyId) {
      const region = await this.getRegion(user.currentJourneyId);
      if (region) {
        currentJourney = region.name;
      }
    }

    // Get achievements count
    const userAchievementsList = Array.from(this.userAchievements.values())
      .filter(ua => ua.userId === userId);
    const totalAchievements = this.achievements.size;

    // Get completed puzzles count
    const completedPuzzlesCount = Array.from(this.userPuzzles.values())
      .filter(up => up.userId === userId && up.completed)
      .length;

    // Get cultures (regions) discovered
    const userRegionsList = Array.from(this.userRegions.values())
      .filter(ur => ur.userId === userId);
    const totalRegions = this.regions.size;

    return {
      user,
      stats: {
        currentJourney,
        achievementsUnlocked: `${userAchievementsList.length} of ${totalAchievements} Unlocked`,
        puzzlesCompleted: completedPuzzlesCount,
        culturesDiscovered: `${userRegionsList.length} of ${totalRegions}`
      }
    };
  }

  // Region operations
  async getAllRegions(): Promise<Region[]> {
    return Array.from(this.regions.values());
  }

  async getRegion(id: number): Promise<Region | undefined> {
    return this.regions.get(id);
  }

  async createRegion(regionData: InsertRegion): Promise<Region> {
    const id = this.currentRegionId++;
    const region: Region = { ...regionData, id };
    this.regions.set(id, region);
    return region;
  }

  async getRegionsWithProgressForUser(userId: number): Promise<RegionWithProgress[]> {
    const regions = await this.getAllRegions();
    const user = await this.getUser(userId);
    
    if (!user) {
      throw new Error("User not found");
    }

    const userRegionsList = Array.from(this.userRegions.values())
      .filter(ur => ur.userId === userId);

    return regions.map(region => {
      const userRegion = userRegionsList.find(ur => ur.regionId === region.id);
      return {
        ...region,
        completionPercentage: userRegion?.completionPercentage || 0,
        isActive: user.currentJourneyId === region.id
      };
    });
  }

  async getRegionWithProgressForUser(regionId: number, userId: number): Promise<RegionWithProgress | undefined> {
    const region = await this.getRegion(regionId);
    const user = await this.getUser(userId);
    
    if (!region || !user) {
      return undefined;
    }

    const userRegion = Array.from(this.userRegions.values())
      .find(ur => ur.userId === userId && ur.regionId === regionId);

    return {
      ...region,
      completionPercentage: userRegion?.completionPercentage || 0,
      isActive: user.currentJourneyId === regionId
    };
  }

  // Puzzle operations
  async getAllPuzzles(userId?: number): Promise<PuzzleWithProgress[]> {
    const puzzles = Array.from(this.puzzles.values());
    
    if (!userId) {
      return puzzles.map(puzzle => ({
        ...puzzle,
        progress: 0,
        completed: false
      }));
    }

    const userPuzzlesList = Array.from(this.userPuzzles.values())
      .filter(up => up.userId === userId);

    return puzzles.map(puzzle => {
      const userPuzzle = userPuzzlesList.find(up => up.puzzleId === puzzle.id);
      return {
        ...puzzle,
        progress: userPuzzle?.progress || 0,
        completed: userPuzzle?.completed || false
      };
    });
  }

  async getPuzzle(id: number): Promise<Puzzle | undefined> {
    return this.puzzles.get(id);
  }

  async createPuzzle(puzzleData: InsertPuzzle): Promise<Puzzle> {
    const id = this.currentPuzzleId++;
    const puzzle: Puzzle = { ...puzzleData, id };
    this.puzzles.set(id, puzzle);
    return puzzle;
  }

  async getPuzzlesByRegion(regionId: number, userId?: number): Promise<PuzzleWithProgress[]> {
    const puzzles = Array.from(this.puzzles.values())
      .filter(puzzle => puzzle.regionId === regionId);
    
    if (!userId) {
      return puzzles.map(puzzle => ({
        ...puzzle,
        progress: 0,
        completed: false
      }));
    }

    const userPuzzlesList = Array.from(this.userPuzzles.values())
      .filter(up => up.userId === userId);

    return puzzles.map(puzzle => {
      const userPuzzle = userPuzzlesList.find(up => up.puzzleId === puzzle.id);
      return {
        ...puzzle,
        progress: userPuzzle?.progress || 0,
        completed: userPuzzle?.completed || false
      };
    });
  }

  async getPuzzleWithProgressForUser(puzzleId: number, userId: number): Promise<PuzzleWithProgress | undefined> {
    const puzzle = await this.getPuzzle(puzzleId);
    
    if (!puzzle) {
      return undefined;
    }

    const userPuzzle = Array.from(this.userPuzzles.values())
      .find(up => up.userId === userId && up.puzzleId === puzzleId);

    return {
      ...puzzle,
      progress: userPuzzle?.progress || 0,
      completed: userPuzzle?.completed || false
    };
  }

  async updateUserPuzzleProgress(userPuzzleData: InsertUserPuzzle): Promise<UserPuzzle> {
    // Check if user puzzle already exists
    const existingUserPuzzle = Array.from(this.userPuzzles.values())
      .find(up => up.userId === userPuzzleData.userId && up.puzzleId === userPuzzleData.puzzleId);

    if (existingUserPuzzle) {
      // Update existing record
      const updatedUserPuzzle: UserPuzzle = {
        ...existingUserPuzzle,
        progress: userPuzzleData.progress,
        completed: userPuzzleData.completed,
        lastPlayedAt: new Date()
      };
      this.userPuzzles.set(existingUserPuzzle.id, updatedUserPuzzle);
      return updatedUserPuzzle;
    } else {
      // Create new record
      const id = this.currentUserPuzzleId++;
      const userPuzzle: UserPuzzle = {
        ...userPuzzleData,
        id,
        lastPlayedAt: new Date()
      };
      this.userPuzzles.set(id, userPuzzle);
      return userPuzzle;
    }
  }

  // Achievement operations
  async getAllAchievements(): Promise<Achievement[]> {
    return Array.from(this.achievements.values());
  }

  async getAchievementsForUser(userId: number): Promise<AchievementWithStatus[]> {
    const achievements = await this.getAllAchievements();
    const userAchievementsList = Array.from(this.userAchievements.values())
      .filter(ua => ua.userId === userId);

    return achievements.map(achievement => {
      const userAchievement = userAchievementsList.find(ua => ua.achievementId === achievement.id);
      return {
        ...achievement,
        unlockedAt: userAchievement?.unlockedAt
      };
    });
  }

  async getRecentAchievementsForUser(userId: number): Promise<(AchievementWithStatus & { unlockedAt: Date })[]> {
    const userAchievementsList = Array.from(this.userAchievements.values())
      .filter(ua => ua.userId === userId)
      .sort((a, b) => b.unlockedAt.getTime() - a.unlockedAt.getTime())
      .slice(0, 5); // Get latest 5

    const result: (AchievementWithStatus & { unlockedAt: Date })[] = [];

    for (const userAchievement of userAchievementsList) {
      const achievement = await this.achievements.get(userAchievement.achievementId);
      if (achievement) {
        result.push({
          ...achievement,
          unlockedAt: userAchievement.unlockedAt
        });
      }
    }

    return result;
  }

  async createAchievement(achievementData: InsertAchievement): Promise<Achievement> {
    const id = this.currentAchievementId++;
    const achievement: Achievement = { ...achievementData, id };
    this.achievements.set(id, achievement);
    return achievement;
  }

  async unlockAchievement(userAchievementData: InsertUserAchievement): Promise<UserAchievement> {
    // Check if already unlocked
    const existingUserAchievement = Array.from(this.userAchievements.values())
      .find(ua => ua.userId === userAchievementData.userId && ua.achievementId === userAchievementData.achievementId);

    if (existingUserAchievement) {
      return existingUserAchievement;
    }

    // Create new unlocked achievement
    const id = this.currentUserAchievementId++;
    const userAchievement: UserAchievement = {
      ...userAchievementData,
      id,
      unlockedAt: new Date()
    };
    this.userAchievements.set(id, userAchievement);
    return userAchievement;
  }
}

export const storage = new MemStorage();
