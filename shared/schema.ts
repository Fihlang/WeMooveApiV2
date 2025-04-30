import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  displayName: text("display_name").notNull(),
  avatarUrl: text("avatar_url"),
  currentJourneyId: integer("current_journey_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Regions table
export const regions = pgTable("regions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  isLocked: boolean("is_locked").default(false).notNull(),
  mapPosition: json("map_position").notNull(), // { top: string, left: string }
  color: text("color").notNull(), // Primary, secondary, accent, info, etc.
});

// Puzzles table
export const puzzles = pgTable("puzzles", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  regionId: integer("region_id").notNull(),
  difficulty: text("difficulty").notNull(), // Easy, Medium, Hard
  type: text("type").notNull(), // Culture, Language, Tradition, etc.
  content: json("content").notNull(), // Puzzle-specific content (varies by puzzle type)
  imageUrl: text("image_url"),
  isNew: boolean("is_new").default(false),
  achievementCount: integer("achievement_count").default(0),
});

// Achievements table
export const achievements = pgTable("achievements", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull(), // Font Awesome icon class
  backgroundColor: text("background_color").notNull(), // Primary, secondary, etc.
  isLocked: boolean("is_locked").default(true).notNull(),
  points: integer("points").default(100).notNull(),
});

// User Achievements (junction table)
export const userAchievements = pgTable("user_achievements", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  achievementId: integer("achievement_id").notNull(),
  unlockedAt: timestamp("unlocked_at").defaultNow().notNull(),
});

// User Puzzles Progress (junction table)
export const userPuzzles = pgTable("user_puzzles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  puzzleId: integer("puzzle_id").notNull(),
  completed: boolean("completed").default(false),
  progress: integer("progress").default(0), // 0-100
  lastPlayedAt: timestamp("last_played_at"),
});

// User Region Progress (junction table)
export const userRegions = pgTable("user_regions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  regionId: integer("region_id").notNull(),
  completionPercentage: integer("completion_percentage").default(0),
  unlockedAt: timestamp("unlocked_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertRegionSchema = createInsertSchema(regions).omit({ id: true });
export const insertPuzzleSchema = createInsertSchema(puzzles).omit({ id: true });
export const insertAchievementSchema = createInsertSchema(achievements).omit({ id: true });
export const insertUserAchievementSchema = createInsertSchema(userAchievements).omit({ id: true, unlockedAt: true });
export const insertUserPuzzleSchema = createInsertSchema(userPuzzles).omit({ id: true, lastPlayedAt: true });
export const insertUserRegionSchema = createInsertSchema(userRegions).omit({ id: true, unlockedAt: true });

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Region = typeof regions.$inferSelect;
export type InsertRegion = z.infer<typeof insertRegionSchema>;

export type Puzzle = typeof puzzles.$inferSelect;
export type InsertPuzzle = z.infer<typeof insertPuzzleSchema>;

export type Achievement = typeof achievements.$inferSelect;
export type InsertAchievement = z.infer<typeof insertAchievementSchema>;

export type UserAchievement = typeof userAchievements.$inferSelect;
export type InsertUserAchievement = z.infer<typeof insertUserAchievementSchema>;

export type UserPuzzle = typeof userPuzzles.$inferSelect;
export type InsertUserPuzzle = z.infer<typeof insertUserPuzzleSchema>;

export type UserRegion = typeof userRegions.$inferSelect;
export type InsertUserRegion = z.infer<typeof insertUserRegionSchema>;

// Extended types for detailed information
export type RegionWithProgress = Region & {
  completionPercentage: number;
  isActive: boolean;
};

export type PuzzleWithProgress = Puzzle & {
  progress: number;
  completed: boolean;
};

export type AchievementWithStatus = Achievement & {
  unlockedAt?: Date;
};
