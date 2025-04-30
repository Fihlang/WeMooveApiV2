import { pgTable, text, serial, integer, boolean, timestamp, json, real, uuid } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User tables
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  password: text("password").notNull(),
  phoneNumber: text("phone_number").notNull(),
  address: text("address"),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  isVerified: boolean("is_verified").default(false).notNull(),
  userType: text("user_type").default("customer").notNull(), // customer, driver, admin
});

export const drivers = pgTable("drivers", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  vehicleType: text("vehicle_type").notNull(),
  licensePlate: text("license_plate").notNull(),
  capacity: text("capacity").notNull(), // Small, Medium, Large
  isAvailable: boolean("is_available").default(true).notNull(),
  currentLatitude: real("current_latitude"),
  currentLongitude: real("current_longitude"),
  rating: real("rating").default(0),
  verificationStatus: text("verification_status").default("pending").notNull(), // pending, approved, rejected
  documents: json("documents"), // URLs to license, insurance, etc.
});

// Furniture and Delivery tables
export const furniture = pgTable("furniture", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  weight: real("weight").notNull(), // in kg
  dimensions: json("dimensions").notNull(), // { length, width, height } in cm
  category: text("category").notNull(), // sofa, table, chair, etc.
  imageUrl: text("image_url"),
});

export const deliveries = pgTable("deliveries", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").references(() => users.id).notNull(),
  driverId: integer("driver_id").references(() => drivers.id),
  status: text("status").default("pending").notNull(), // pending, assigned, in_progress, delivered, cancelled
  pickupAddress: text("pickup_address").notNull(),
  pickupLatitude: real("pickup_latitude"),
  pickupLongitude: real("pickup_longitude"),
  destinationAddress: text("destination_address").notNull(),
  destinationLatitude: real("destination_latitude"),
  destinationLongitude: real("destination_longitude"),
  scheduledDate: timestamp("scheduled_date").notNull(),
  completedDate: timestamp("completed_date"),
  specialInstructions: text("special_instructions"),
  totalPrice: real("total_price").notNull(),
  distance: real("distance"), // in km
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const deliveryItems = pgTable("delivery_items", {
  id: serial("id").primaryKey(),
  deliveryId: integer("delivery_id").references(() => deliveries.id).notNull(),
  furnitureId: integer("furniture_id").references(() => furniture.id).notNull(),
  quantity: integer("quantity").default(1).notNull(),
  specialHandling: boolean("special_handling").default(false).notNull(),
});

// Reviews and Payments
export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  deliveryId: integer("delivery_id").references(() => deliveries.id).notNull(), 
  customerId: integer("customer_id").references(() => users.id).notNull(),
  driverId: integer("driver_id").references(() => drivers.id).notNull(),
  rating: integer("rating").notNull(), // 1-5
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  deliveryId: integer("delivery_id").references(() => deliveries.id).notNull(),
  amount: real("amount").notNull(),
  status: text("status").default("pending").notNull(), // pending, completed, failed
  paymentMethod: text("payment_method").notNull(), // credit_card, paypal, etc.
  transactionId: text("transaction_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Chat and Notifications
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  deliveryId: integer("delivery_id").references(() => deliveries.id).notNull(),
  senderId: integer("sender_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  isRead: boolean("is_read").default(false).notNull(),
});

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull(), // delivery_status, chat_message, payment, etc.
  referenceId: integer("reference_id"), // ID of related entity (delivery, payment, etc.)
  isRead: boolean("is_read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  deliveries: many(deliveries, { relationName: "customerDeliveries" }),
  reviews: many(reviews, { relationName: "customerReviews" }),
  drivers: many(drivers),
  messages: many(messages, { relationName: "userMessages" }),
  notifications: many(notifications),
}));

export const driversRelations = relations(drivers, ({ one, many }) => ({
  user: one(users, {
    fields: [drivers.userId],
    references: [users.id],
  }),
  deliveries: many(deliveries),
  reviews: many(reviews, { relationName: "driverReviews" }),
}));

export const deliveriesRelations = relations(deliveries, ({ one, many }) => ({
  customer: one(users, {
    fields: [deliveries.customerId],
    references: [users.id],
  }),
  driver: one(drivers, {
    fields: [deliveries.driverId],
    references: [drivers.id],
  }),
  items: many(deliveryItems),
  reviews: many(reviews),
  payments: many(payments),
  messages: many(messages),
}));

export const deliveryItemsRelations = relations(deliveryItems, ({ one }) => ({
  delivery: one(deliveries, {
    fields: [deliveryItems.deliveryId],
    references: [deliveries.id],
  }),
  furniture: one(furniture, {
    fields: [deliveryItems.furnitureId],
    references: [furniture.id],
  }),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  delivery: one(deliveries, {
    fields: [reviews.deliveryId],
    references: [deliveries.id],
  }),
  customer: one(users, {
    fields: [reviews.customerId],
    references: [users.id],
  }),
  driver: one(drivers, {
    fields: [reviews.driverId],
    references: [drivers.id],
  }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  delivery: one(deliveries, {
    fields: [payments.deliveryId],
    references: [deliveries.id],
  }),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  delivery: one(deliveries, {
    fields: [messages.deliveryId],
    references: [deliveries.id],
  }),
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

// Insert Schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertDriverSchema = createInsertSchema(drivers).omit({ id: true });
export const insertFurnitureSchema = createInsertSchema(furniture).omit({ id: true });
export const insertDeliverySchema = createInsertSchema(deliveries).omit({ id: true, createdAt: true, updatedAt: true });
export const insertDeliveryItemSchema = createInsertSchema(deliveryItems).omit({ id: true });
export const insertReviewSchema = createInsertSchema(reviews).omit({ id: true, createdAt: true });
export const insertPaymentSchema = createInsertSchema(payments).omit({ id: true, createdAt: true });
export const insertMessageSchema = createInsertSchema(messages).omit({ id: true, createdAt: true });
export const insertNotificationSchema = createInsertSchema(notifications).omit({ id: true, createdAt: true });

// Export types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Driver = typeof drivers.$inferSelect;
export type InsertDriver = z.infer<typeof insertDriverSchema>;

export type Furniture = typeof furniture.$inferSelect;
export type InsertFurniture = z.infer<typeof insertFurnitureSchema>;

export type Delivery = typeof deliveries.$inferSelect;
export type InsertDelivery = z.infer<typeof insertDeliverySchema>;

export type DeliveryItem = typeof deliveryItems.$inferSelect;
export type InsertDeliveryItem = z.infer<typeof insertDeliveryItemSchema>;

export type Review = typeof reviews.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;

export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

// Domain-specific types
export type DeliveryWithItems = Delivery & {
  items: (DeliveryItem & { furniture: Furniture })[];
  customer: User;
  driver?: Driver & { user: User };
};

export type DriverWithDetails = Driver & {
  user: User;
  reviewCount: number;
  averageRating: number;
};
