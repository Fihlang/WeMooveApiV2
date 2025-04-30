import {
  User,
  InsertUser,
  Driver,
  InsertDriver,
  Furniture,
  InsertFurniture,
  Delivery,
  InsertDelivery,
  DeliveryItem,
  InsertDeliveryItem,
  Review,
  InsertReview,
  Payment,
  InsertPayment,
  Message,
  InsertMessage,
  Notification,
  InsertNotification,
  DeliveryWithItems,
  DriverWithDetails
} from "@shared/schema";

// Interface for all Furniture Delivery app storage operations
export interface IFurnitureStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User>;
  
  // Driver operations
  getDriver(id: number): Promise<Driver | undefined>;
  getDriverByUserId(userId: number): Promise<Driver | undefined>;
  getDriversNearby(latitude: number, longitude: number, radius: number): Promise<DriverWithDetails[]>;
  createDriver(driver: InsertDriver): Promise<Driver>;
  updateDriver(id: number, driver: Partial<InsertDriver>): Promise<Driver>;
  updateDriverLocation(id: number, latitude: number, longitude: number): Promise<Driver>;
  
  // Furniture operations
  getFurniture(id: number): Promise<Furniture | undefined>;
  getAllFurniture(): Promise<Furniture[]>;
  getFurnitureByCategory(category: string): Promise<Furniture[]>;
  createFurniture(furniture: InsertFurniture): Promise<Furniture>;
  
  // Delivery operations
  getDelivery(id: number): Promise<Delivery | undefined>;
  getDeliveryWithItems(id: number): Promise<DeliveryWithItems | undefined>;
  getDeliveriesByCustomerId(customerId: number): Promise<Delivery[]>;
  getDeliveriesByDriverId(driverId: number): Promise<Delivery[]>;
  getActiveDeliveriesByDriverId(driverId: number): Promise<Delivery[]>;
  createDelivery(delivery: InsertDelivery): Promise<Delivery>;
  updateDeliveryStatus(id: number, status: string): Promise<Delivery>;
  assignDriverToDelivery(deliveryId: number, driverId: number): Promise<Delivery>;
  
  // Delivery Item operations
  createDeliveryItem(item: InsertDeliveryItem): Promise<DeliveryItem>;
  getDeliveryItemsByDeliveryId(deliveryId: number): Promise<DeliveryItem[]>;
  
  // Review operations
  createReview(review: InsertReview): Promise<Review>;
  getReviewsByDriverId(driverId: number): Promise<Review[]>;
  getReviewsByCustomerId(customerId: number): Promise<Review[]>;
  getAverageDriverRating(driverId: number): Promise<number>;
  
  // Payment operations
  createPayment(payment: InsertPayment): Promise<Payment>;
  getPaymentByDeliveryId(deliveryId: number): Promise<Payment | undefined>;
  updatePaymentStatus(id: number, status: string): Promise<Payment>;
  
  // Message operations
  createMessage(message: InsertMessage): Promise<Message>;
  getMessagesByDeliveryId(deliveryId: number): Promise<Message[]>;
  markMessageAsRead(id: number): Promise<Message>;
  
  // Notification operations
  createNotification(notification: InsertNotification): Promise<Notification>;
  getNotificationsByUserId(userId: number): Promise<Notification[]>;
  getUnreadNotificationsByUserId(userId: number): Promise<Notification[]>;
  markNotificationAsRead(id: number): Promise<Notification>;
}

export class FurnitureMemStorage implements IFurnitureStorage {
  private users: Map<number, User>;
  private drivers: Map<number, Driver>;
  private furniture: Map<number, Furniture>;
  private deliveries: Map<number, Delivery>;
  private deliveryItems: Map<number, DeliveryItem>;
  private reviews: Map<number, Review>;
  private payments: Map<number, Payment>;
  private messages: Map<number, Message>;
  private notifications: Map<number, Notification>;

  private currentUserId: number;
  private currentDriverId: number;
  private currentFurnitureId: number;
  private currentDeliveryId: number;
  private currentDeliveryItemId: number;
  private currentReviewId: number;
  private currentPaymentId: number;
  private currentMessageId: number;
  private currentNotificationId: number;

  constructor() {
    this.users = new Map();
    this.drivers = new Map();
    this.furniture = new Map();
    this.deliveries = new Map();
    this.deliveryItems = new Map();
    this.reviews = new Map();
    this.payments = new Map();
    this.messages = new Map();
    this.notifications = new Map();

    this.currentUserId = 1;
    this.currentDriverId = 1;
    this.currentFurnitureId = 1;
    this.currentDeliveryId = 1;
    this.currentDeliveryItemId = 1;
    this.currentReviewId = 1;
    this.currentPaymentId = 1;
    this.currentMessageId = 1;
    this.currentNotificationId = 1;

    // Initialize with sample data
    this.initializeSampleData();
  }

  private initializeSampleData() {
    // Create sample users
    const users: User[] = [
      {
        id: this.currentUserId++,
        email: "johndoe@example.com",
        firstName: "John",
        lastName: "Doe",
        password: "password123", // In a real app, this would be hashed
        phoneNumber: "+1234567890",
        address: "123 Main St, City, State, 12345",
        avatarUrl: "https://randomuser.me/api/portraits/men/1.jpg",
        createdAt: new Date(),
        isVerified: true,
        userType: "customer"
      },
      {
        id: this.currentUserId++,
        email: "janedoe@example.com",
        firstName: "Jane",
        lastName: "Doe",
        password: "password123",
        phoneNumber: "+0987654321",
        address: "456 Elm St, City, State, 54321",
        avatarUrl: "https://randomuser.me/api/portraits/women/1.jpg",
        createdAt: new Date(),
        isVerified: true,
        userType: "customer"
      },
      {
        id: this.currentUserId++,
        email: "driver1@example.com",
        firstName: "Mike",
        lastName: "Smith",
        password: "password123",
        phoneNumber: "+1122334455",
        address: "789 Oak St, City, State, 67890",
        avatarUrl: "https://randomuser.me/api/portraits/men/2.jpg",
        createdAt: new Date(),
        isVerified: true,
        userType: "driver"
      },
      {
        id: this.currentUserId++,
        email: "driver2@example.com",
        firstName: "Sarah",
        lastName: "Johnson",
        password: "password123",
        phoneNumber: "+5566778899",
        address: "321 Pine St, City, State, 09876",
        avatarUrl: "https://randomuser.me/api/portraits/women/2.jpg",
        createdAt: new Date(),
        isVerified: true,
        userType: "driver"
      }
    ];
    
    users.forEach(user => this.users.set(user.id, user));

    // Create sample drivers
    const drivers: Driver[] = [
      {
        id: this.currentDriverId++,
        userId: 3, // Mike Smith
        vehicleType: "Pickup Truck",
        licensePlate: "ABC123",
        capacity: "Large",
        isAvailable: true,
        currentLatitude: 37.7749,
        currentLongitude: -122.4194,
        rating: 4.8,
        verificationStatus: "approved",
        documents: { 
          license: "https://example.com/license/driver1.jpg",
          insurance: "https://example.com/insurance/driver1.pdf"
        }
      },
      {
        id: this.currentDriverId++,
        userId: 4, // Sarah Johnson
        vehicleType: "Van",
        licensePlate: "XYZ789",
        capacity: "Medium",
        isAvailable: true,
        currentLatitude: 37.7833,
        currentLongitude: -122.4167,
        rating: 4.6,
        verificationStatus: "approved",
        documents: { 
          license: "https://example.com/license/driver2.jpg",
          insurance: "https://example.com/insurance/driver2.pdf"
        }
      }
    ];
    
    drivers.forEach(driver => this.drivers.set(driver.id, driver));

    // Create sample furniture
    const furnitureItems: Furniture[] = [
      {
        id: this.currentFurnitureId++,
        name: "Leather Sofa",
        description: "A 3-seater leather sofa in brown color",
        weight: 85.5,
        dimensions: { length: 220, width: 95, height: 85 },
        category: "sofa",
        imageUrl: "https://example.com/furniture/sofa1.jpg"
      },
      {
        id: this.currentFurnitureId++,
        name: "Dining Table",
        description: "Wooden dining table with 6 chairs",
        weight: 75.0,
        dimensions: { length: 180, width: 90, height: 75 },
        category: "table",
        imageUrl: "https://example.com/furniture/table1.jpg"
      },
      {
        id: this.currentFurnitureId++,
        name: "King Size Bed",
        description: "King size bed with wooden frame",
        weight: 120.0,
        dimensions: { length: 200, width: 180, height: 100 },
        category: "bed",
        imageUrl: "https://example.com/furniture/bed1.jpg"
      },
      {
        id: this.currentFurnitureId++,
        name: "Wardrobe",
        description: "Large wardrobe with sliding doors",
        weight: 105.0,
        dimensions: { length: 150, width: 60, height: 220 },
        category: "wardrobe",
        imageUrl: "https://example.com/furniture/wardrobe1.jpg"
      }
    ];
    
    furnitureItems.forEach(item => this.furniture.set(item.id, item));

    // Create sample deliveries
    const deliveries: Delivery[] = [
      {
        id: this.currentDeliveryId++,
        customerId: 1, // John Doe
        driverId: 1, // Mike Smith
        status: "completed",
        pickupAddress: "123 Warehouse St, City, State, 12345",
        pickupLatitude: 37.7800,
        pickupLongitude: -122.4100,
        destinationAddress: "123 Main St, City, State, 12345",
        destinationLatitude: 37.7900,
        destinationLongitude: -122.4000,
        scheduledDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        completedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000), // 3 hours after scheduled
        specialInstructions: "Please be careful with the sofa, it's new",
        totalPrice: 120.00,
        distance: 5.2,
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
      },
      {
        id: this.currentDeliveryId++,
        customerId: 2, // Jane Doe
        driverId: 2, // Sarah Johnson
        status: "in_progress",
        pickupAddress: "456 Storage Blvd, City, State, 54321",
        pickupLatitude: 37.7700,
        pickupLongitude: -122.4200,
        destinationAddress: "456 Elm St, City, State, 54321",
        destinationLatitude: 37.7600,
        destinationLongitude: -122.4300,
        scheduledDate: new Date(Date.now()),
        completedDate: undefined,
        specialInstructions: "Call before arrival",
        totalPrice: 85.50,
        distance: 3.8,
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000) // 1 hour ago
      },
      {
        id: this.currentDeliveryId++,
        customerId: 1, // John Doe
        driverId: undefined,
        status: "pending",
        pickupAddress: "789 Furniture Store, City, State, 67890",
        pickupLatitude: 37.7650,
        pickupLongitude: -122.4250,
        destinationAddress: "123 Main St, City, State, 12345",
        destinationLatitude: 37.7900,
        destinationLongitude: -122.4000,
        scheduledDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days in future
        completedDate: undefined,
        specialInstructions: "The wardrobe is very heavy, need at least 2 people",
        totalPrice: 150.00,
        distance: 6.1,
        createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
        updatedAt: new Date(Date.now() - 12 * 60 * 60 * 1000)
      }
    ];
    
    deliveries.forEach(delivery => this.deliveries.set(delivery.id, delivery));

    // Create sample delivery items
    const deliveryItems: DeliveryItem[] = [
      {
        id: this.currentDeliveryItemId++,
        deliveryId: 1,
        furnitureId: 1, // Leather Sofa
        quantity: 1,
        specialHandling: true
      },
      {
        id: this.currentDeliveryItemId++,
        deliveryId: 2,
        furnitureId: 2, // Dining Table
        quantity: 1,
        specialHandling: false
      },
      {
        id: this.currentDeliveryItemId++,
        deliveryId: 2,
        furnitureId: 3, // King Size Bed
        quantity: 1,
        specialHandling: true
      },
      {
        id: this.currentDeliveryItemId++,
        deliveryId: 3,
        furnitureId: 4, // Wardrobe
        quantity: 1,
        specialHandling: true
      }
    ];
    
    deliveryItems.forEach(item => this.deliveryItems.set(item.id, item));

    // Create sample reviews
    const reviews: Review[] = [
      {
        id: this.currentReviewId++,
        deliveryId: 1,
        customerId: 1, // John Doe
        driverId: 1, // Mike Smith
        rating: 5,
        comment: "Excellent service, very careful with my new sofa",
        createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000) // 4 days ago
      }
    ];
    
    reviews.forEach(review => this.reviews.set(review.id, review));

    // Create sample payments
    const payments: Payment[] = [
      {
        id: this.currentPaymentId++,
        deliveryId: 1,
        amount: 120.00,
        status: "completed",
        paymentMethod: "credit_card",
        transactionId: "txn_123456789",
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 days ago
      },
      {
        id: this.currentPaymentId++,
        deliveryId: 2,
        amount: 85.50,
        status: "pending",
        paymentMethod: "paypal",
        transactionId: "txn_987654321",
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
      },
      {
        id: this.currentPaymentId++,
        deliveryId: 3,
        amount: 150.00,
        status: "pending",
        paymentMethod: "credit_card",
        transactionId: "txn_567890123",
        createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000) // 12 hours ago
      }
    ];
    
    payments.forEach(payment => this.payments.set(payment.id, payment));

    // Create sample messages
    const messages: Message[] = [
      {
        id: this.currentMessageId++,
        deliveryId: 1,
        senderId: 1, // John Doe
        content: "Hi, what time will you arrive?",
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 - 4 * 60 * 60 * 1000), // 4 hours before delivery
        isRead: true
      },
      {
        id: this.currentMessageId++,
        deliveryId: 1,
        senderId: 3, // Mike (driver's user ID)
        content: "I'll be there in about 30 minutes",
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 - 3.5 * 60 * 60 * 1000), // 30 min after previous message
        isRead: true
      },
      {
        id: this.currentMessageId++,
        deliveryId: 2,
        senderId: 2, // Jane Doe
        content: "Please call me when you're on your way",
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        isRead: true
      },
      {
        id: this.currentMessageId++,
        deliveryId: 2,
        senderId: 4, // Sarah (driver's user ID)
        content: "Will do! I should be there in about an hour",
        createdAt: new Date(Date.now() - 1.5 * 60 * 60 * 1000), // 1.5 hours ago
        isRead: false
      }
    ];
    
    messages.forEach(message => this.messages.set(message.id, message));

    // Create sample notifications
    const notifications: Notification[] = [
      {
        id: this.currentNotificationId++,
        userId: 1, // John Doe
        title: "Delivery Completed",
        message: "Your furniture has been delivered successfully",
        type: "delivery_status",
        referenceId: 1, // Delivery ID
        isRead: true,
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
      },
      {
        id: this.currentNotificationId++,
        userId: 2, // Jane Doe
        title: "Delivery Started",
        message: "Your furniture is on the way",
        type: "delivery_status",
        referenceId: 2, // Delivery ID
        isRead: false,
        createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000)
      },
      {
        id: this.currentNotificationId++,
        userId: 3, // Mike (driver)
        title: "New Message",
        message: "You have a new message from John Doe",
        type: "chat_message",
        referenceId: 1, // Message ID
        isRead: true,
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 - 4 * 60 * 60 * 1000)
      },
      {
        id: this.currentNotificationId++,
        userId: 4, // Sarah (driver)
        title: "New Message",
        message: "You have a new message from Jane Doe",
        type: "chat_message",
        referenceId: 3, // Message ID
        isRead: true,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
      }
    ];
    
    notifications.forEach(notification => this.notifications.set(notification.id, notification));
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email
    );
  }

  async createUser(userData: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...userData, id, createdAt: new Date() };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User> {
    const existingUser = await this.getUser(id);
    if (!existingUser) {
      throw new Error("User not found");
    }
    
    const updatedUser: User = { ...existingUser, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Driver operations
  async getDriver(id: number): Promise<Driver | undefined> {
    return this.drivers.get(id);
  }

  async getDriverByUserId(userId: number): Promise<Driver | undefined> {
    return Array.from(this.drivers.values()).find(
      (driver) => driver.userId === userId
    );
  }

  async getDriversNearby(latitude: number, longitude: number, radius: number): Promise<DriverWithDetails[]> {
    // In a real app, we would use a spatial query to find drivers within the radius
    // For this demo, we'll just return all available drivers with user details
    const availableDrivers = Array.from(this.drivers.values()).filter(driver => driver.isAvailable);
    
    return Promise.all(availableDrivers.map(async driver => {
      const user = await this.getUser(driver.userId);
      if (!user) {
        throw new Error("Driver user not found");
      }
      
      const reviews = await this.getReviewsByDriverId(driver.id);
      const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / (reviews.length || 1);
      
      return {
        ...driver,
        user,
        reviewCount: reviews.length,
        averageRating
      };
    }));
  }

  async createDriver(driverData: InsertDriver): Promise<Driver> {
    const id = this.currentDriverId++;
    const driver: Driver = { ...driverData, id };
    this.drivers.set(id, driver);
    return driver;
  }

  async updateDriver(id: number, driverData: Partial<InsertDriver>): Promise<Driver> {
    const existingDriver = await this.getDriver(id);
    if (!existingDriver) {
      throw new Error("Driver not found");
    }
    
    const updatedDriver: Driver = { ...existingDriver, ...driverData };
    this.drivers.set(id, updatedDriver);
    return updatedDriver;
  }

  async updateDriverLocation(id: number, latitude: number, longitude: number): Promise<Driver> {
    const driver = await this.getDriver(id);
    if (!driver) {
      throw new Error("Driver not found");
    }
    
    const updatedDriver: Driver = { 
      ...driver, 
      currentLatitude: latitude, 
      currentLongitude: longitude 
    };
    
    this.drivers.set(id, updatedDriver);
    return updatedDriver;
  }

  // Furniture operations
  async getFurniture(id: number): Promise<Furniture | undefined> {
    return this.furniture.get(id);
  }

  async getAllFurniture(): Promise<Furniture[]> {
    return Array.from(this.furniture.values());
  }

  async getFurnitureByCategory(category: string): Promise<Furniture[]> {
    return Array.from(this.furniture.values()).filter(
      (furniture) => furniture.category === category
    );
  }

  async createFurniture(furnitureData: InsertFurniture): Promise<Furniture> {
    const id = this.currentFurnitureId++;
    const furniture: Furniture = { ...furnitureData, id };
    this.furniture.set(id, furniture);
    return furniture;
  }

  // Delivery operations
  async getDelivery(id: number): Promise<Delivery | undefined> {
    return this.deliveries.get(id);
  }

  async getDeliveryWithItems(id: number): Promise<DeliveryWithItems | undefined> {
    const delivery = await this.getDelivery(id);
    if (!delivery) {
      return undefined;
    }
    
    const customer = await this.getUser(delivery.customerId);
    if (!customer) {
      throw new Error("Customer not found");
    }
    
    let driver: (Driver & { user: User }) | undefined;
    if (delivery.driverId) {
      const driverData = await this.getDriver(delivery.driverId);
      if (driverData) {
        const user = await this.getUser(driverData.userId);
        if (user) {
          driver = { ...driverData, user };
        }
      }
    }
    
    const deliveryItems = await this.getDeliveryItemsByDeliveryId(id);
    const itemsWithFurniture = await Promise.all(deliveryItems.map(async item => {
      const furniture = await this.getFurniture(item.furnitureId);
      if (!furniture) {
        throw new Error("Furniture not found");
      }
      return { ...item, furniture };
    }));
    
    return {
      ...delivery,
      customer,
      driver,
      items: itemsWithFurniture
    };
  }

  async getDeliveriesByCustomerId(customerId: number): Promise<Delivery[]> {
    return Array.from(this.deliveries.values()).filter(
      (delivery) => delivery.customerId === customerId
    );
  }

  async getDeliveriesByDriverId(driverId: number): Promise<Delivery[]> {
    return Array.from(this.deliveries.values()).filter(
      (delivery) => delivery.driverId === driverId
    );
  }

  async getActiveDeliveriesByDriverId(driverId: number): Promise<Delivery[]> {
    return Array.from(this.deliveries.values()).filter(
      (delivery) => 
        delivery.driverId === driverId && 
        (delivery.status === "assigned" || delivery.status === "in_progress")
    );
  }

  async createDelivery(deliveryData: InsertDelivery): Promise<Delivery> {
    const id = this.currentDeliveryId++;
    const delivery: Delivery = { 
      ...deliveryData, 
      id, 
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.deliveries.set(id, delivery);
    return delivery;
  }

  async updateDeliveryStatus(id: number, status: string): Promise<Delivery> {
    const delivery = await this.getDelivery(id);
    if (!delivery) {
      throw new Error("Delivery not found");
    }
    
    let completedDate = delivery.completedDate;
    if (status === "delivered" && !completedDate) {
      completedDate = new Date();
    }
    
    const updatedDelivery: Delivery = { 
      ...delivery, 
      status,
      completedDate,
      updatedAt: new Date() 
    };
    
    this.deliveries.set(id, updatedDelivery);
    return updatedDelivery;
  }

  async assignDriverToDelivery(deliveryId: number, driverId: number): Promise<Delivery> {
    const delivery = await this.getDelivery(deliveryId);
    if (!delivery) {
      throw new Error("Delivery not found");
    }
    
    const driver = await this.getDriver(driverId);
    if (!driver) {
      throw new Error("Driver not found");
    }
    
    const updatedDelivery: Delivery = { 
      ...delivery, 
      driverId,
      status: "assigned",
      updatedAt: new Date() 
    };
    
    this.deliveries.set(deliveryId, updatedDelivery);
    return updatedDelivery;
  }

  // Delivery Item operations
  async createDeliveryItem(itemData: InsertDeliveryItem): Promise<DeliveryItem> {
    const id = this.currentDeliveryItemId++;
    const deliveryItem: DeliveryItem = { ...itemData, id };
    this.deliveryItems.set(id, deliveryItem);
    return deliveryItem;
  }

  async getDeliveryItemsByDeliveryId(deliveryId: number): Promise<DeliveryItem[]> {
    return Array.from(this.deliveryItems.values()).filter(
      (item) => item.deliveryId === deliveryId
    );
  }

  // Review operations
  async createReview(reviewData: InsertReview): Promise<Review> {
    const id = this.currentReviewId++;
    const review: Review = { ...reviewData, id, createdAt: new Date() };
    this.reviews.set(id, review);
    
    // Update driver rating
    const driver = await this.getDriver(reviewData.driverId);
    if (driver) {
      const reviews = await this.getReviewsByDriverId(reviewData.driverId);
      const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0) + reviewData.rating;
      const newAverageRating = totalRating / (reviews.length + 1);
      
      await this.updateDriver(reviewData.driverId, { rating: newAverageRating });
    }
    
    return review;
  }

  async getReviewsByDriverId(driverId: number): Promise<Review[]> {
    return Array.from(this.reviews.values()).filter(
      (review) => review.driverId === driverId
    );
  }

  async getReviewsByCustomerId(customerId: number): Promise<Review[]> {
    return Array.from(this.reviews.values()).filter(
      (review) => review.customerId === customerId
    );
  }

  async getAverageDriverRating(driverId: number): Promise<number> {
    const reviews = await this.getReviewsByDriverId(driverId);
    if (reviews.length === 0) {
      return 0;
    }
    
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    return totalRating / reviews.length;
  }

  // Payment operations
  async createPayment(paymentData: InsertPayment): Promise<Payment> {
    const id = this.currentPaymentId++;
    const payment: Payment = { ...paymentData, id, createdAt: new Date() };
    this.payments.set(id, payment);
    return payment;
  }

  async getPaymentByDeliveryId(deliveryId: number): Promise<Payment | undefined> {
    return Array.from(this.payments.values()).find(
      (payment) => payment.deliveryId === deliveryId
    );
  }

  async updatePaymentStatus(id: number, status: string): Promise<Payment> {
    const payment = await this.payments.get(id);
    if (!payment) {
      throw new Error("Payment not found");
    }
    
    const updatedPayment: Payment = { ...payment, status };
    this.payments.set(id, updatedPayment);
    return updatedPayment;
  }

  // Message operations
  async createMessage(messageData: InsertMessage): Promise<Message> {
    const id = this.currentMessageId++;
    const message: Message = { ...messageData, id, createdAt: new Date() };
    this.messages.set(id, message);
    return message;
  }

  async getMessagesByDeliveryId(deliveryId: number): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter(message => message.deliveryId === deliveryId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  async markMessageAsRead(id: number): Promise<Message> {
    const message = await this.messages.get(id);
    if (!message) {
      throw new Error("Message not found");
    }
    
    const updatedMessage: Message = { ...message, isRead: true };
    this.messages.set(id, updatedMessage);
    return updatedMessage;
  }

  // Notification operations
  async createNotification(notificationData: InsertNotification): Promise<Notification> {
    const id = this.currentNotificationId++;
    const notification: Notification = { ...notificationData, id, createdAt: new Date() };
    this.notifications.set(id, notification);
    return notification;
  }

  async getNotificationsByUserId(userId: number): Promise<Notification[]> {
    return Array.from(this.notifications.values())
      .filter(notification => notification.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()); // Newest first
  }

  async getUnreadNotificationsByUserId(userId: number): Promise<Notification[]> {
    return (await this.getNotificationsByUserId(userId))
      .filter(notification => !notification.isRead);
  }

  async markNotificationAsRead(id: number): Promise<Notification> {
    const notification = await this.notifications.get(id);
    if (!notification) {
      throw new Error("Notification not found");
    }
    
    const updatedNotification: Notification = { ...notification, isRead: true };
    this.notifications.set(id, updatedNotification);
    return updatedNotification;
  }
}

export const furnitureStorage = new FurnitureMemStorage();