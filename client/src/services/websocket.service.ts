import { useEffect, useRef, useState } from 'react';

// Message types
export type MessageType = 
  | 'connected'
  | 'authenticated'
  | 'driver_location_update'
  | 'delivery_status_update'
  | 'new_message'
  | 'error';

// Message interfaces
export interface WebSocketMessage {
  type: MessageType;
  [key: string]: any;
}

export interface LocationUpdateMessage extends WebSocketMessage {
  type: 'driver_location_update';
  driverId: number;
  latitude: number;
  longitude: number;
  timestamp: Date;
}

export interface DeliveryStatusUpdateMessage extends WebSocketMessage {
  type: 'delivery_status_update';
  deliveryId: number;
  status: string;
  timestamp: Date;
}

export interface NewMessageMessage extends WebSocketMessage {
  type: 'new_message';
  message: {
    id: number;
    senderId: number;
    senderType: string;
    deliveryId: number;
    content: string;
    createdAt: Date;
    isRead: boolean;
  };
  timestamp: Date;
}

// Hook for using WebSocket
export function useWebSocket() {
  const [connected, setConnected] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [messages, setMessages] = useState<WebSocketMessage[]>([]);
  const socketRef = useRef<WebSocket | null>(null);
  
  // Initialize WebSocket connection
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;
    
    socket.onopen = () => {
      console.log('WebSocket connection established');
      setConnected(true);
    };
    
    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as WebSocketMessage;
        console.log('Received WebSocket message:', message);
        
        // Handle different message types
        switch (message.type) {
          case 'connected':
            // Do nothing, we already track connection state
            break;
          case 'authenticated':
            setAuthenticated(true);
            break;
          default:
            // Add message to the messages array
            setMessages(prev => [...prev, message]);
            break;
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
    
    socket.onclose = () => {
      console.log('WebSocket connection closed');
      setConnected(false);
      setAuthenticated(false);
    };
    
    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    
    // Clean up the WebSocket connection when the component unmounts
    return () => {
      socket.close();
    };
  }, []);
  
  // Function to send a message to the WebSocket server
  const sendMessage = (message: any) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(message));
    } else {
      console.error('WebSocket is not connected');
    }
  };
  
  // Authenticate with the WebSocket server
  const authenticate = (userId: number, userType: string, driverId?: number) => {
    sendMessage({
      type: 'authenticate',
      userId,
      userType,
      driverId
    });
  };
  
  // Send a driver location update
  const updateDriverLocation = (driverId: number, deliveryId: number, latitude: number, longitude: number) => {
    sendMessage({
      type: 'driver_location_update',
      driverId,
      deliveryId,
      latitude,
      longitude
    });
  };
  
  // Send a delivery status update
  const updateDeliveryStatus = (deliveryId: number, status: string) => {
    sendMessage({
      type: 'delivery_status_update',
      deliveryId,
      status
    });
  };
  
  // Send a new message
  const sendChatMessage = (message: {
    senderId: number;
    senderType: string;
    deliveryId: number;
    content: string;
  }) => {
    sendMessage({
      type: 'new_message',
      message
    });
  };
  
  // Filter messages by type
  const getMessagesByType = <T extends WebSocketMessage>(type: MessageType): T[] => {
    return messages.filter(m => m.type === type) as T[];
  };
  
  // Get latest location update for a driver
  const getLatestDriverLocation = (driverId: number): LocationUpdateMessage | undefined => {
    const locationUpdates = getMessagesByType<LocationUpdateMessage>('driver_location_update')
      .filter(m => m.driverId === driverId);
      
    if (locationUpdates.length === 0) return undefined;
    
    // Sort by timestamp (descending) and return the most recent
    return locationUpdates.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )[0];
  };
  
  // Get latest status for a delivery
  const getLatestDeliveryStatus = (deliveryId: number): DeliveryStatusUpdateMessage | undefined => {
    const statusUpdates = getMessagesByType<DeliveryStatusUpdateMessage>('delivery_status_update')
      .filter(m => m.deliveryId === deliveryId);
      
    if (statusUpdates.length === 0) return undefined;
    
    // Sort by timestamp (descending) and return the most recent
    return statusUpdates.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )[0];
  };
  
  // Get all messages for a delivery
  const getDeliveryMessages = (deliveryId: number): NewMessageMessage[] => {
    return getMessagesByType<NewMessageMessage>('new_message')
      .filter(m => m.message.deliveryId === deliveryId)
      .sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
  };
  
  return {
    connected,
    authenticated,
    authenticate,
    updateDriverLocation,
    updateDeliveryStatus,
    sendChatMessage,
    getLatestDriverLocation,
    getLatestDeliveryStatus,
    getDeliveryMessages,
    allMessages: messages
  };
}