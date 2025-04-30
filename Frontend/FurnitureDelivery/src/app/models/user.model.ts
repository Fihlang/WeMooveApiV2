export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  address: string | null;
  avatarUrl: string | null;
  userType: string; // 'customer' or 'driver'
  isVerified: boolean;
  createdAt: Date;
}

export interface Driver {
  id: number;
  userId: number;
  vehicleType: string;
  licensePlate: string;
  capacity: string;
  rating: number | null;
  isAvailable: boolean;
  currentLatitude: number | null;
  currentLongitude: number | null;
  verificationStatus: string;
  documents: any;
}

export interface DriverWithDetails extends Driver {
  user: User;
}

export interface CustomerProfile extends User {
  // Additional customer-specific fields can be added here
}

export interface DriverProfile extends User {
  driver: Driver;
}