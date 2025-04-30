export interface Delivery {
  id: number;
  createdAt: Date;
  updatedAt: Date;
  customerId: number;
  customerName?: string;
  customerPhone?: string;
  driverId?: number;
  driverName?: string;
  driverPhone?: string;
  status: string;
  scheduledDate: Date;
  pickupAddress: string;
  destinationAddress: string;
  totalPrice: number;
  paymentStatus?: string;
  specialInstructions?: string;
  distance?: number;
  estimatedDuration?: number;
  actualDuration?: number;
  trackingNumber: string;
  items?: DeliveryItem[];
  events?: DeliveryEvent[];
}

export interface DeliveryItem {
  id: number;
  deliveryId: number;
  furnitureId: number;
  furnitureName?: string;
  furnitureCategory?: string;
  furnitureImageUrl?: string;
  quantity: number;
  specialHandling: boolean;
  price?: number;
}

export interface DeliveryEvent {
  timestamp: Date;
  status: string;
  description: string;
  agentId?: number;
  agentName?: string;
  location?: Location;
}

export interface Location {
  latitude: number;
  longitude: number;
  address?: string;
}

export interface CreateDeliveryRequest {
  pickupAddress: string;
  destinationAddress: string;
  scheduledDate: Date;
  specialInstructions?: string;
  items: CreateDeliveryItemRequest[];
  customerId?: number; // May be taken from current user
  totalPrice?: number; // May be calculated on server
  paymentMethod?: string; // For creating a payment record
}

export interface CreateDeliveryItemRequest {
  furnitureId: number;
  quantity: number;
  specialHandling: boolean;
}

export interface UpdateDeliveryStatusRequest {
  status: string;
  location?: Location;
  notes?: string;
}

export interface AssignDriverRequest {
  driverId: number;
}

export interface Review {
  id: number;
  createdAt: Date;
  deliveryId: number;
  customerId: number;
  customerName?: string;
  driverId: number;
  driverName?: string;
  rating: number;
  comment?: string;
}

export interface CreateReviewRequest {
  deliveryId: number;
  rating: number;
  comment?: string;
}