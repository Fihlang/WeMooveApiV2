export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  address?: string;
  avatarUrl?: string;
  isVerified: boolean;
  userType: string;
}

export interface Driver {
  id: number;
  userId: number;
  vehicleType: string;
  licensePlate: string;
  capacity: string;
  rating?: number;
  isAvailable: boolean;
  currentLatitude?: number;
  currentLongitude?: number;
  verificationStatus: string;
}

export interface AuthResponse {
  token: string;
  user: User;
  driver?: Driver;
  expiresAt: Date;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  address?: string;
  userType: string;
}

export interface RegisterDriverRequest extends RegisterRequest {
  vehicleType: string;
  licensePlate: string;
  capacity: string;
}

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  address?: string;
  avatarUrl?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}