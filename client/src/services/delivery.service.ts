import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

// Interfaces
export interface Furniture {
  id: number;
  name: string;
  description: string | null;
  weight: number;
  dimensions: any;
  category: string;
  imageUrl: string | null;
}

export interface DeliveryItem {
  id: number;
  deliveryId: number;
  furnitureId: number;
  quantity: number;
  specialHandling: boolean;
  furniture?: Furniture;
}

export interface Driver {
  id: number;
  userId: number;
  vehicleType: string;
  licensePlate: string;
  capacity: string;
  isAvailable: boolean;
  currentLatitude: number | null;
  currentLongitude: number | null;
  rating: number | null;
  verificationStatus: string;
  documents: any;
  user?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    avatarUrl: string | null;
  };
}

export interface Delivery {
  id: number;
  createdAt: Date;
  customerId: number;
  driverId: number | null;
  status: string;
  pickupAddress: string;
  pickupLatitude: number | null;
  pickupLongitude: number | null;
  destinationAddress: string;
  destinationLatitude: number | null;
  destinationLongitude: number | null;
  scheduledDate: Date;
  completedDate: Date | null;
  totalPrice: number;
  distance: number | null;
  updatedAt: Date;
  items?: DeliveryItem[];
  driver?: Driver;
}

export interface Message {
  id: number;
  deliveryId: number;
  senderId: number;
  senderType: string;
  content: string;
  createdAt: Date;
  isRead: boolean;
}

export interface Review {
  id: number;
  deliveryId: number;
  customerId: number;
  driverId: number;
  rating: number;
  comment: string | null;
  createdAt: Date;
}

export interface Notification {
  id: number;
  userId: number;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
}

// Mutations and queries

// Furniture queries
export function useFurniture() {
  const getAll = (category?: string) => {
    return useQuery({
      queryKey: category ? ['/api/furniture', category] : ['/api/furniture'],
      queryFn: () => apiRequest<Furniture[]>(`/api/furniture${category ? `?category=${category}` : ''}`),
    });
  };

  const getById = (id: number) => {
    return useQuery({
      queryKey: ['/api/furniture', id],
      queryFn: () => apiRequest<Furniture>(`/api/furniture/${id}`),
      enabled: !!id,
    });
  };

  return { getAll, getById };
}

// Delivery queries and mutations
export function useDeliveries() {
  const queryClient = useQueryClient();

  const getByCustomerId = (customerId: number) => {
    return useQuery({
      queryKey: ['/api/customers', customerId, 'deliveries'],
      queryFn: () => apiRequest<Delivery[]>(`/api/customers/${customerId}/deliveries`),
      enabled: !!customerId,
    });
  };

  const getActiveByCustomerId = (customerId: number) => {
    return useQuery({
      queryKey: ['/api/customers', customerId, 'deliveries', 'active'],
      queryFn: () => apiRequest<Delivery[]>(`/api/customers/${customerId}/deliveries/active`),
      enabled: !!customerId,
    });
  };

  const getRecentByCustomerId = (customerId: number) => {
    return useQuery({
      queryKey: ['/api/customers', customerId, 'deliveries', 'recent'],
      queryFn: () => apiRequest<Delivery[]>(`/api/customers/${customerId}/deliveries/recent`),
      enabled: !!customerId,
    });
  };

  const getByDriverId = (driverId: number) => {
    return useQuery({
      queryKey: ['/api/drivers', driverId, 'deliveries'],
      queryFn: () => apiRequest<Delivery[]>(`/api/drivers/${driverId}/deliveries`),
      enabled: !!driverId,
    });
  };

  const getActiveByDriverId = (driverId: number) => {
    return useQuery({
      queryKey: ['/api/drivers', driverId, 'active-deliveries'],
      queryFn: () => apiRequest<Delivery[]>(`/api/drivers/${driverId}/active-deliveries`),
      enabled: !!driverId,
    });
  };

  const getById = (id: number) => {
    return useQuery({
      queryKey: ['/api/deliveries', id],
      queryFn: () => apiRequest<Delivery>(`/api/deliveries/${id}`),
      enabled: !!id,
    });
  };

  const create = useMutation({
    mutationFn: (data: any) => apiRequest<Delivery>('/api/deliveries', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['/api/deliveries'] });
      queryClient.invalidateQueries({ queryKey: ['/api/customers'] });
    },
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => apiRequest<Delivery>(`/api/deliveries/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
    onSuccess: (_, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['/api/deliveries', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['/api/deliveries'] });
      queryClient.invalidateQueries({ queryKey: ['/api/customers'] });
      queryClient.invalidateQueries({ queryKey: ['/api/drivers'] });
    },
  });

  const assignDriver = useMutation({
    mutationFn: ({ id, driverId }: { id: number; driverId: number }) => apiRequest<Delivery>(`/api/deliveries/${id}/driver`, {
      method: 'PATCH',
      body: JSON.stringify({ driverId }),
    }),
    onSuccess: (_, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['/api/deliveries', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['/api/deliveries'] });
      queryClient.invalidateQueries({ queryKey: ['/api/customers'] });
      queryClient.invalidateQueries({ queryKey: ['/api/drivers', variables.driverId] });
    },
  });

  return {
    getByCustomerId,
    getActiveByCustomerId,
    getRecentByCustomerId,
    getByDriverId,
    getActiveByDriverId,
    getById,
    create,
    updateStatus,
    assignDriver,
  };
}

// Driver queries and mutations
export function useDrivers() {
  const queryClient = useQueryClient();

  const getByUserId = (userId: number) => {
    return useQuery({
      queryKey: ['/api/drivers', 'user', userId],
      queryFn: () => apiRequest<Driver>(`/api/drivers/user/${userId}`),
      enabled: !!userId,
    });
  };

  const getById = (id: number) => {
    return useQuery({
      queryKey: ['/api/drivers', id],
      queryFn: () => apiRequest<Driver>(`/api/drivers/${id}`),
      enabled: !!id,
    });
  };

  const getNearby = (latitude: number, longitude: number, radius: number = 10) => {
    return useQuery({
      queryKey: ['/api/drivers/nearby', latitude, longitude, radius],
      queryFn: () => apiRequest<Driver[]>(`/api/drivers/nearby?latitude=${latitude}&longitude=${longitude}&radius=${radius}`),
      enabled: !!latitude && !!longitude,
    });
  };

  const updateLocation = useMutation({
    mutationFn: ({ id, latitude, longitude }: { id: number; latitude: number; longitude: number }) => apiRequest<Driver>(`/api/drivers/${id}/location`, {
      method: 'PATCH',
      body: JSON.stringify({ latitude, longitude }),
    }),
    onSuccess: (_, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['/api/drivers', variables.id] });
    },
  });

  return {
    getByUserId,
    getById,
    getNearby,
    updateLocation,
  };
}

// Message queries and mutations
export function useMessages() {
  const queryClient = useQueryClient();

  const getByDeliveryId = (deliveryId: number) => {
    return useQuery({
      queryKey: ['/api/deliveries', deliveryId, 'messages'],
      queryFn: () => apiRequest<Message[]>(`/api/deliveries/${deliveryId}/messages`),
      enabled: !!deliveryId,
    });
  };

  const create = useMutation({
    mutationFn: (data: Omit<Message, 'id' | 'createdAt' | 'isRead'>) => apiRequest<Message>('/api/messages', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    onSuccess: (_, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['/api/deliveries', variables.deliveryId, 'messages'] });
    },
  });

  const markAsRead = useMutation({
    mutationFn: (id: number) => apiRequest<Message>(`/api/messages/${id}/read`, {
      method: 'PATCH',
    }),
    onSuccess: (data) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['/api/deliveries', data.deliveryId, 'messages'] });
    },
  });

  return {
    getByDeliveryId,
    create,
    markAsRead,
  };
}

// Review queries and mutations
export function useReviews() {
  const queryClient = useQueryClient();

  const getByDriverId = (driverId: number) => {
    return useQuery({
      queryKey: ['/api/drivers', driverId, 'reviews'],
      queryFn: () => apiRequest<Review[]>(`/api/drivers/${driverId}/reviews`),
      enabled: !!driverId,
    });
  };

  const create = useMutation({
    mutationFn: (data: Omit<Review, 'id' | 'createdAt'>) => apiRequest<Review>('/api/reviews', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    onSuccess: (_, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['/api/drivers', variables.driverId, 'reviews'] });
    },
  });

  return {
    getByDriverId,
    create,
  };
}

// Notification queries and mutations
export function useNotifications() {
  const queryClient = useQueryClient();

  const getByUserId = (userId: number) => {
    return useQuery({
      queryKey: ['/api/users', userId, 'notifications'],
      queryFn: () => apiRequest<Notification[]>(`/api/users/${userId}/notifications`),
      enabled: !!userId,
    });
  };

  const getUnreadByUserId = (userId: number) => {
    return useQuery({
      queryKey: ['/api/users', userId, 'unread-notifications'],
      queryFn: () => apiRequest<Notification[]>(`/api/users/${userId}/unread-notifications`),
      enabled: !!userId,
    });
  };

  const markAsRead = useMutation({
    mutationFn: (id: number) => apiRequest<Notification>(`/api/notifications/${id}/read`, {
      method: 'PATCH',
    }),
    onSuccess: (data) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['/api/users', data.userId, 'notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users', data.userId, 'unread-notifications'] });
    },
  });

  return {
    getByUserId,
    getUnreadByUserId,
    markAsRead,
  };
}