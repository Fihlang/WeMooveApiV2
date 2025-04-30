import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocket } from "ws";
import { storage } from "./storage";
import { furnitureStorage } from "./furniture-storage";
import { z } from "zod";
import { WebSocketService } from "./websocket";
import { 
  insertAchievementSchema, 
  insertPuzzleSchema, 
  insertRegionSchema, 
  insertUserAchievementSchema, 
  insertUserPuzzleSchema, 
  insertUserRegionSchema, 
  insertUserSchema,
  
  // Furniture schemas
  insertDeliverySchema,
  insertDeliveryItemSchema,
  insertDriverSchema,
  insertFurnitureSchema,
  insertMessageSchema,
  insertNotificationSchema,
  insertPaymentSchema,
  insertReviewSchema
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
  
  // =============== FURNITURE DELIVERY API ROUTES ===============
  
  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = req.body;
      const user = await furnitureStorage.createUser(userData);
      res.status(201).json({ user, token: "mock-jwt-token" });
    } catch (error) {
      res.status(500).json({ message: "Error creating user" });
    }
  });
  
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await furnitureStorage.getUserByEmail(email);
      
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      res.json({ user, token: "mock-jwt-token" });
    } catch (error) {
      res.status(500).json({ message: "Error during login" });
    }
  });
  
  // Furniture routes
  app.get("/api/furniture", async (req, res) => {
    try {
      const category = req.query.category as string;
      
      const furniture = category 
        ? await furnitureStorage.getFurnitureByCategory(category)
        : await furnitureStorage.getAllFurniture();
        
      res.json(furniture);
    } catch (error) {
      res.status(500).json({ message: "Error retrieving furniture" });
    }
  });
  
  app.get("/api/furniture/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const furniture = await furnitureStorage.getFurniture(id);
      
      if (!furniture) {
        return res.status(404).json({ message: "Furniture not found" });
      }
      
      res.json(furniture);
    } catch (error) {
      res.status(500).json({ message: "Error retrieving furniture" });
    }
  });
  
  // Delivery routes
  app.get("/api/deliveries/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const delivery = await furnitureStorage.getDeliveryWithItems(id);
      
      if (!delivery) {
        return res.status(404).json({ message: "Delivery not found" });
      }
      
      res.json(delivery);
    } catch (error) {
      res.status(500).json({ message: "Error retrieving delivery" });
    }
  });
  
  app.post("/api/deliveries", async (req, res) => {
    try {
      const deliveryData = req.body;
      const delivery = await furnitureStorage.createDelivery(deliveryData);
      res.status(201).json(delivery);
    } catch (error) {
      res.status(500).json({ message: "Error creating delivery" });
    }
  });
  
  app.patch("/api/deliveries/:id/status", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      
      const delivery = await furnitureStorage.updateDeliveryStatus(id, status);
      res.json(delivery);
    } catch (error) {
      res.status(500).json({ message: "Error updating delivery status" });
    }
  });
  
  app.patch("/api/deliveries/:id/driver", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { driverId } = req.body;
      
      const delivery = await furnitureStorage.assignDriverToDelivery(id, driverId);
      res.json(delivery);
    } catch (error) {
      res.status(500).json({ message: "Error assigning driver" });
    }
  });
  
  // Customer-specific delivery routes
  app.get("/api/customers/:id/deliveries", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deliveries = await furnitureStorage.getDeliveriesByCustomerId(id);
      res.json(deliveries);
    } catch (error) {
      res.status(500).json({ message: "Error retrieving customer deliveries" });
    }
  });
  
  app.get("/api/customers/:id/deliveries/active", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      // In a real app, we would filter active deliveries
      const deliveries = await furnitureStorage.getDeliveriesByCustomerId(id);
      res.json(deliveries.filter(d => d.status !== 'completed' && d.status !== 'cancelled'));
    } catch (error) {
      res.status(500).json({ message: "Error retrieving active deliveries" });
    }
  });
  
  app.get("/api/customers/:id/deliveries/recent", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      // In a real app, we would get only recent deliveries
      const deliveries = await furnitureStorage.getDeliveriesByCustomerId(id);
      res.json(deliveries.filter(d => d.status === 'completed').slice(0, 5));
    } catch (error) {
      res.status(500).json({ message: "Error retrieving recent deliveries" });
    }
  });
  
  // Driver-specific routes
  app.get("/api/drivers/:id/deliveries", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deliveries = await furnitureStorage.getDeliveriesByDriverId(id);
      res.json(deliveries);
    } catch (error) {
      res.status(500).json({ message: "Error retrieving driver deliveries" });
    }
  });
  
  app.get("/api/drivers/:id/active-deliveries", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deliveries = await furnitureStorage.getActiveDeliveriesByDriverId(id);
      res.json(deliveries);
    } catch (error) {
      res.status(500).json({ message: "Error retrieving active deliveries" });
    }
  });
  
  app.patch("/api/drivers/:id/location", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { latitude, longitude } = req.body;
      
      const driver = await furnitureStorage.updateDriverLocation(id, latitude, longitude);
      res.json(driver);
    } catch (error) {
      res.status(500).json({ message: "Error updating driver location" });
    }
  });
  
  app.get("/api/drivers/nearby", async (req, res) => {
    try {
      const latitude = parseFloat(req.query.latitude as string);
      const longitude = parseFloat(req.query.longitude as string);
      const radius = parseFloat(req.query.radius as string) || 10; // default 10km
      
      const drivers = await furnitureStorage.getDriversNearby(latitude, longitude, radius);
      res.json(drivers);
    } catch (error) {
      res.status(500).json({ message: "Error finding nearby drivers" });
    }
  });
  
  // Messages routes
  app.get("/api/deliveries/:id/messages", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const messages = await furnitureStorage.getMessagesByDeliveryId(id);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Error retrieving messages" });
    }
  });
  
  app.post("/api/messages", async (req, res) => {
    try {
      const messageData = req.body;
      const message = await furnitureStorage.createMessage(messageData);
      res.status(201).json(message);
    } catch (error) {
      res.status(500).json({ message: "Error sending message" });
    }
  });
  
  app.patch("/api/messages/:id/read", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const message = await furnitureStorage.markMessageAsRead(id);
      res.json(message);
    } catch (error) {
      res.status(500).json({ message: "Error marking message as read" });
    }
  });
  
  // Reviews routes
  app.get("/api/drivers/:id/reviews", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const reviews = await furnitureStorage.getReviewsByDriverId(id);
      res.json(reviews);
    } catch (error) {
      res.status(500).json({ message: "Error retrieving driver reviews" });
    }
  });
  
  app.post("/api/reviews", async (req, res) => {
    try {
      const reviewData = req.body;
      const review = await furnitureStorage.createReview(reviewData);
      res.status(201).json(review);
    } catch (error) {
      res.status(500).json({ message: "Error creating review" });
    }
  });
  
  // Notifications routes
  app.get("/api/users/:id/notifications", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const notifications = await furnitureStorage.getNotificationsByUserId(id);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ message: "Error retrieving notifications" });
    }
  });
  
  app.get("/api/users/:id/unread-notifications", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const notifications = await furnitureStorage.getUnreadNotificationsByUserId(id);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ message: "Error retrieving unread notifications" });
    }
  });
  
  app.patch("/api/notifications/:id/read", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const notification = await furnitureStorage.markNotificationAsRead(id);
      res.json(notification);
    } catch (error) {
      res.status(500).json({ message: "Error marking notification as read" });
    }
  });

  const httpServer = createServer(app);
  
  // Initialize WebSocket service using our dedicated WebSocketService class
  const webSocketService = new WebSocketService(httpServer);
  console.log('WebSocket service initialized');
  
  // API endpoints for sending WebSocket notifications
  
  // Send notification to a specific user
  app.post("/api/notifications/send", async (req, res) => {
    try {
      const { userId, type, message } = req.body;
      
      if (!userId || !message) {
        return res.status(400).json({ message: "userId and message are required" });
      }
      
      // Create notification in database
      const notification = await furnitureStorage.createNotification({
        userId,
        type: type || 'custom',
        message,
        isRead: false
      });
      
      // Send via WebSocket
      webSocketService.sendToUser(userId, {
        type: 'new_notification',
        payload: notification
      });
      
      res.status(201).json({ success: true, notification });
    } catch (error) {
      res.status(500).json({ message: "Error sending notification" });
    }
  });
  
  // Broadcast delivery status update
  app.post("/api/deliveries/:id/broadcast", async (req, res) => {
    try {
      const deliveryId = parseInt(req.params.id);
      const { type, payload } = req.body;
      
      if (!type) {
        return res.status(400).json({ message: "Message type is required" });
      }
      
      const delivery = await furnitureStorage.getDeliveryWithItems(deliveryId);
      
      if (!delivery) {
        return res.status(404).json({ message: "Delivery not found" });
      }
      
      webSocketService.broadcastToDelivery(deliveryId, {
        type: type || 'delivery_update',
        payload: payload || delivery
      });
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Error broadcasting delivery update" });
    }
  });
  
  // Update all drivers about new delivery request
  app.post("/api/deliveries/:id/broadcast-to-drivers", async (req, res) => {
    try {
      const deliveryId = parseInt(req.params.id);
      const delivery = await furnitureStorage.getDeliveryWithItems(deliveryId);
      
      if (!delivery) {
        return res.status(404).json({ message: "Delivery not found" });
      }
      
      webSocketService.broadcastToDrivers({
        type: 'new_delivery_request',
        payload: delivery
      });
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Error broadcasting to drivers" });
    }
  });
  
  // Add middleware to automatically send WebSocket notifications on delivery status changes
  app.use((req, res, next) => {
    // Save the original json method
    const originalJson = res.json;
    
    // Override the json method
    res.json = function(body) {
      // Check if this is a delivery status update
      if (req.method === 'PATCH' && 
          req.url.includes('/api/deliveries/') && 
          req.url.includes('/status') && 
          res.statusCode >= 200 && 
          res.statusCode < 300 && 
          body && 
          body.id) {
        
        const deliveryId = body.id;
        
        // Notify about status change via WebSocket
        webSocketService.broadcastToDelivery(deliveryId, {
          type: 'delivery_status_update',
          payload: body
        });
        
        // Create notification for the customer
        if (body.customerId) {
          furnitureStorage.createNotification({
            userId: body.customerId,
            type: 'delivery_status',
            message: `Your delivery #${body.id} status has been updated to: ${body.status}`,
            isRead: false
          }).then(notification => {
            webSocketService.sendToUser(body.customerId, {
              type: 'new_notification',
              payload: notification
            });
          });
        }
      }
      
      // Call the original method
      return originalJson.call(this, body);
    };
    
    next();
  });
  
  return httpServer;
}
