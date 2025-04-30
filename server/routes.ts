import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { 
  insertAchievementSchema, 
  insertPuzzleSchema, 
  insertRegionSchema, 
  insertUserAchievementSchema, 
  insertUserPuzzleSchema, 
  insertUserRegionSchema, 
  insertUserSchema 
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // prefix all routes with /api
  
  // User routes
  app.get("/api/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Error retrieving user" });
    }
  });

  app.post("/api/users", async (req, res) => {
    try {
      const validatedUser = insertUserSchema.parse(req.body);
      const user = await storage.createUser(validatedUser);
      res.status(201).json(user);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid user data", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating user" });
    }
  });

  app.get("/api/users/:id/dashboard", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const dashboard = await storage.getUserDashboard(id);
      res.json(dashboard);
    } catch (error) {
      res.status(500).json({ message: "Error retrieving dashboard" });
    }
  });

  // Region routes
  app.get("/api/regions", async (req, res) => {
    try {
      const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
      const regions = userId ? 
        await storage.getRegionsWithProgressForUser(userId) : 
        await storage.getAllRegions();
      res.json(regions);
    } catch (error) {
      res.status(500).json({ message: "Error retrieving regions" });
    }
  });

  app.get("/api/regions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
      
      const region = userId ? 
        await storage.getRegionWithProgressForUser(id, userId) : 
        await storage.getRegion(id);
      
      if (!region) {
        return res.status(404).json({ message: "Region not found" });
      }
      
      res.json(region);
    } catch (error) {
      res.status(500).json({ message: "Error retrieving region" });
    }
  });

  app.post("/api/regions", async (req, res) => {
    try {
      const validatedRegion = insertRegionSchema.parse(req.body);
      const region = await storage.createRegion(validatedRegion);
      res.status(201).json(region);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid region data", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating region" });
    }
  });

  // Puzzle routes
  app.get("/api/puzzles", async (req, res) => {
    try {
      const regionId = req.query.regionId ? parseInt(req.query.regionId as string) : undefined;
      const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
      
      const puzzles = regionId ? 
        await storage.getPuzzlesByRegion(regionId, userId) : 
        await storage.getAllPuzzles(userId);
      
      res.json(puzzles);
    } catch (error) {
      res.status(500).json({ message: "Error retrieving puzzles" });
    }
  });

  app.get("/api/puzzles/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
      
      const puzzle = userId ?
        await storage.getPuzzleWithProgressForUser(id, userId) :
        await storage.getPuzzle(id);
      
      if (!puzzle) {
        return res.status(404).json({ message: "Puzzle not found" });
      }
      
      res.json(puzzle);
    } catch (error) {
      res.status(500).json({ message: "Error retrieving puzzle" });
    }
  });

  app.post("/api/puzzles", async (req, res) => {
    try {
      const validatedPuzzle = insertPuzzleSchema.parse(req.body);
      const puzzle = await storage.createPuzzle(validatedPuzzle);
      res.status(201).json(puzzle);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid puzzle data", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating puzzle" });
    }
  });

  // Achievement routes
  app.get("/api/achievements", async (req, res) => {
    try {
      const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
      
      const achievements = userId ?
        await storage.getAchievementsForUser(userId) :
        await storage.getAllAchievements();
      
      res.json(achievements);
    } catch (error) {
      res.status(500).json({ message: "Error retrieving achievements" });
    }
  });
  
  app.get("/api/achievements/recent", async (req, res) => {
    try {
      const userId = parseInt(req.query.userId as string);
      if (!userId) {
        return res.status(400).json({ message: "userId is required" });
      }
      
      const recentAchievements = await storage.getRecentAchievementsForUser(userId);
      res.json(recentAchievements);
    } catch (error) {
      res.status(500).json({ message: "Error retrieving recent achievements" });
    }
  });

  app.post("/api/achievements", async (req, res) => {
    try {
      const validatedAchievement = insertAchievementSchema.parse(req.body);
      const achievement = await storage.createAchievement(validatedAchievement);
      res.status(201).json(achievement);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid achievement data", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating achievement" });
    }
  });

  // User progress routes
  app.post("/api/users/:userId/puzzles/:puzzleId/progress", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const puzzleId = parseInt(req.params.puzzleId);
      const { progress, completed } = req.body;
      
      const validatedUserPuzzle = insertUserPuzzleSchema.parse({
        userId,
        puzzleId,
        progress,
        completed
      });
      
      const userPuzzle = await storage.updateUserPuzzleProgress(validatedUserPuzzle);
      res.status(200).json(userPuzzle);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid progress data", errors: error.errors });
      }
      res.status(500).json({ message: "Error updating puzzle progress" });
    }
  });

  app.post("/api/users/:userId/achievements/:achievementId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const achievementId = parseInt(req.params.achievementId);
      
      const validatedUserAchievement = insertUserAchievementSchema.parse({
        userId,
        achievementId
      });
      
      const userAchievement = await storage.unlockAchievement(validatedUserAchievement);
      res.status(200).json(userAchievement);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid achievement data", errors: error.errors });
      }
      res.status(500).json({ message: "Error unlocking achievement" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
