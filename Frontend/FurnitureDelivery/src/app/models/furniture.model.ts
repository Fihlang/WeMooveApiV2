export interface Furniture {
  id: number;
  name: string;
  description?: string;
  weight: number;
  dimensions: any; // This would be a JSON object with width, height, depth
  category: string;
  imageUrl?: string;
  price?: number;
}

export interface Message {
  id: number;
  createdAt: Date;
  deliveryId: number;
  senderId: number;
  senderName?: string;
  recipientId: number;
  recipientName?: string;
  content: string;
  isRead: boolean;
}

export interface CreateMessageRequest {
  deliveryId: number;
  recipientId: number;
  content: string;
}

export interface Notification {
  id: number;
  createdAt: Date;
  userId: number;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  relatedEntityType?: string;
  relatedEntityId?: number;
}

// WebSocket message types
export interface WebSocketMessage {
  type: string;
  data: any;
}

export interface StatusUpdateMessage {
  deliveryId: number;
  status: string;
  previousStatus?: string;
  updatedAt: Date;
}

export interface LocationUpdateMessage {
  driverId: number;
  deliveryId?: number;
  latitude: number;
  longitude: number;
  updatedAt: Date;
  heading?: number;
  speed?: number;
  estimatedArrival?: Date;
}

export interface DriverAvailabilityMessage {
  driverId: number;
  userId: number;
  isAvailable: boolean;
  updatedAt: Date;
}

export interface DeliveryAssignmentMessage {
  deliveryId: number;
  driverId: number;
  assignedAt: Date;
  estimatedPickupTime?: Date;
  estimatedDeliveryTime?: Date;
}

export interface NewMessageNotification {
  messageId: number;
  deliveryId: number;
  senderId: number;
  senderName: string;
  content: string;
  timestamp: Date;
}