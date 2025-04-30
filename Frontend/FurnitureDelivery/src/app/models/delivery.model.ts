import { DeliveryItem } from './delivery-item.model';
import { DriverWithDetails } from './user.model';

export interface Delivery {
  id: number;
  customerId: number;
  driverId: number | null;
  status: string;
  scheduledDate: Date;
  createdAt: Date;
  updatedAt: Date;
  totalPrice: number;
  pickupAddress: string;
  pickupLatitude: number | null;
  pickupLongitude: number | null;
  destinationAddress: string;
  destinationLatitude: number | null;
  destinationLongitude: number | null;
  paymentStatus: string;
  specialInstructions: string | null;
  distance: number | null;
}

export interface DeliveryWithItems extends Delivery {
  items: DeliveryItem[];
  driver?: DriverWithDetails;
}

export interface DeliveryTracking {
  id: number;
  deliveryId: number;
  driverId: number;
  timestamp: Date;
  latitude: number;
  longitude: number;
  status: string;
}