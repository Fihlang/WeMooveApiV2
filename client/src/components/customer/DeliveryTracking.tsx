import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import { PackageOpen, MapPin, Clock, AlertTriangle, CheckCircle, ChevronLeft, Phone, MessageSquare, Star, TruckIcon } from "lucide-react";
import { websocketService } from "@/services/websocket.service";

interface DeliveryTrackingProps {
  deliveryId: number;
}

// Delivery status types
type DeliveryStatus = 
  | "pending" 
  | "driver_assigned" 
  | "picked_up" 
  | "in_transit" 
  | "out_for_delivery" 
  | "delivered" 
  | "cancelled";

interface Delivery {
  id: number;
  status: DeliveryStatus;
  createdAt: string;
  scheduledDate: string;
  pickupAddress: string;
  destinationAddress: string;
  totalPrice: number;
  driver?: {
    id: number;
    name: string;
    phone: string;
    vehicleType: string;
    licensePlate: string;
    rating: number;
    avatar?: string;
  };
  tracking?: {
    currentLatitude: number;
    currentLongitude: number;
    estimatedArrival: string;
    lastUpdated: string;
  };
  items: Array<{
    id: number;
    furnitureId: number;
    furnitureName: string;
    quantity: number;
    specialHandling: boolean;
  }>;
}

export default function DeliveryTracking({ deliveryId }: DeliveryTrackingProps) {
  const [delivery, setDelivery] = useState<Delivery | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [messages, setMessages] = useState<Array<{id: number, text: string, sender: 'driver' | 'customer', timestamp: string}>>([]);
  const [newMessage, setNewMessage] = useState<string>("");
  
  // Progress mapping based on status
  const getProgressValue = (status: DeliveryStatus): number => {
    const statusMap: Record<DeliveryStatus, number> = {
      pending: 10,
      driver_assigned: 25,
      picked_up: 40,
      in_transit: 60,
      out_for_delivery: 80,
      delivered: 100,
      cancelled: 0
    };
    
    return statusMap[status] || 0;
  };
  
  useEffect(() => {
    fetchDelivery();
    
    // Connect to WebSocket for real-time updates
    const connected = websocketService.connect();
    if (connected) {
      // Subscribe to this specific delivery
      websocketService.subscribeToDelivery(deliveryId);
    }
    
    // Handle WebSocket messages
    const handleStatusUpdate = (data: any) => {
      setDelivery(prevDelivery => {
        if (!prevDelivery) return null;
        return { ...prevDelivery, status: data.status };
      });
      
      toast({
        title: "Delivery Updated",
        description: `Status has been updated to ${data.status.replace(/_/g, ' ')}`,
      });
    };
    
    const handleLocationUpdate = (data: any) => {
      setDelivery(prevDelivery => {
        if (!prevDelivery) return null;
        return { 
          ...prevDelivery, 
          tracking: {
            ...prevDelivery.tracking,
            currentLatitude: data.latitude,
            currentLongitude: data.longitude,
            lastUpdated: new Date().toISOString()
          }
        };
      });
    };
    
    const handleMessageReceived = (data: any) => {
      if (data.deliveryId === deliveryId) {
        setMessages(prev => [...prev, {
          id: data.id,
          text: data.text,
          sender: 'driver',
          timestamp: new Date().toISOString()
        }]);
      }
    };
    
    // Register all handlers
    const removeStatusHandler = websocketService.on('delivery_status_updated', handleStatusUpdate);
    const removeLocationHandler = websocketService.on('driver_location_updated', handleLocationUpdate);
    const removeMessageHandler = websocketService.on('new_message', handleMessageReceived);
    
    // Cleanup on unmount
    return () => {
      removeStatusHandler();
      removeLocationHandler();
      removeMessageHandler();
      websocketService.unsubscribeFromDelivery(deliveryId);
    };
  }, [deliveryId]);
  
  const fetchDelivery = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/deliveries/${deliveryId}`);
      if (response.ok) {
        const data = await response.json();
        setDelivery(data);
        // Also fetch messages
        fetchMessages();
      } else {
        console.error('Failed to fetch delivery details');
        toast({
          title: "Error",
          description: "Failed to load delivery details. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error fetching delivery:', error);
      toast({
        title: "Error",
        description: "An error occurred while loading the delivery details.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const fetchMessages = async () => {
    try {
      const response = await fetch(`/api/deliveries/${deliveryId}/messages`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      } else {
        console.error('Failed to fetch messages');
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };
  
  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    
    try {
      const response = await fetch(`/api/deliveries/${deliveryId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: newMessage,
          senderId: 1, // Mock user ID
          recipientId: delivery?.driver?.id || 0,
          deliveryId
        }),
      });
      
      if (response.ok) {
        // Add the message to the local state immediately for better UX
        setMessages(prev => [...prev, {
          id: Date.now(), // Temporary ID
          text: newMessage,
          sender: 'customer',
          timestamp: new Date().toISOString()
        }]);
        setNewMessage(""); // Clear input
      } else {
        toast({
          title: "Error",
          description: "Failed to send message. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "An error occurred while sending your message.",
        variant: "destructive",
      });
    }
  };
  
  // Format date in a user-friendly way
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (error) {
      return dateString;
    }
  };
  
  // Helper to get status badge
  const getStatusBadge = (status: DeliveryStatus) => {
    const statusMap: Record<DeliveryStatus, { color: string, icon: JSX.Element }> = {
      'pending': { 
        color: 'bg-gray-500', 
        icon: <Clock className="h-3 w-3" /> 
      },
      'driver_assigned': { 
        color: 'bg-blue-500', 
        icon: <TruckIcon className="h-3 w-3" /> 
      },
      'picked_up': { 
        color: 'bg-cyan-500', 
        icon: <PackageOpen className="h-3 w-3" /> 
      },
      'in_transit': { 
        color: 'bg-indigo-500', 
        icon: <TruckIcon className="h-3 w-3" /> 
      },
      'out_for_delivery': { 
        color: 'bg-purple-500', 
        icon: <TruckIcon className="h-3 w-3" /> 
      },
      'delivered': { 
        color: 'bg-green-500', 
        icon: <CheckCircle className="h-3 w-3" /> 
      },
      'cancelled': { 
        color: 'bg-red-500', 
        icon: <AlertTriangle className="h-3 w-3" /> 
      }
    };
    
    const statusInfo = statusMap[status] || { color: 'bg-gray-500', icon: <Clock className="h-3 w-3" /> };
    const label = status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    
    return (
      <Badge className={`${statusInfo.color} flex items-center gap-1`}>
        {statusInfo.icon}
        <span>{label}</span>
      </Badge>
    );
  };
  
  // Generate star rating display
  const renderStarRating = (rating: number) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
        <span className="ml-1 text-sm font-medium">{rating.toFixed(1)}</span>
      </div>
    );
  };
  
  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Loading delivery details...</p>
        </CardContent>
      </Card>
    );
  }
  
  if (!delivery) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <AlertTriangle className="h-12 w-12 mx-auto text-red-500 mb-4" />
          <p className="text-xl font-medium mb-2">Delivery Not Found</p>
          <p className="text-gray-500 mb-4">We couldn't find the delivery you're looking for.</p>
          <Button asChild>
            <Link href="/delivery/dashboard">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="space-y-8">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <div>
              <Link href="/delivery/dashboard" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-2">
                <ChevronLeft className="mr-1 h-4 w-4" />
                Back to Dashboard
              </Link>
              <CardTitle className="flex items-center gap-2">
                Delivery #{delivery.id}
                {getStatusBadge(delivery.status)}
              </CardTitle>
            </div>
          </div>
          <CardDescription>
            Created on {formatDate(delivery.createdAt)}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="pb-2 space-y-4">
          {/* Delivery Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Delivery Progress</span>
              <span className="font-medium">{delivery.status === 'delivered' ? 'Completed' : 'In Progress'}</span>
            </div>
            <Progress value={getProgressValue(delivery.status)} className="h-2" />
          </div>
          
          {/* Delivery Details */}
          <div className="grid grid-cols-1 gap-4 pt-4 border-t">
            <div className="flex items-center">
              <MapPin className="h-5 w-5 text-muted-foreground mr-2 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium">Pickup Location</p>
                <p className="text-sm text-muted-foreground">{delivery.pickupAddress}</p>
              </div>
            </div>
            
            <div className="flex items-center">
              <MapPin className="h-5 w-5 text-primary mr-2 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium">Delivery Location</p>
                <p className="text-sm text-muted-foreground">{delivery.destinationAddress}</p>
              </div>
            </div>
            
            <div className="flex items-center">
              <Clock className="h-5 w-5 text-muted-foreground mr-2 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium">Scheduled Delivery Date</p>
                <p className="text-sm text-muted-foreground">{formatDate(delivery.scheduledDate)}</p>
              </div>
            </div>
            
            {delivery.tracking && delivery.tracking.estimatedArrival && (
              <div className="flex items-center">
                <Clock className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium">Estimated Arrival</p>
                  <p className="text-sm text-muted-foreground">{formatDate(delivery.tracking.estimatedArrival)}</p>
                </div>
              </div>
            )}
            
            <div className="flex items-center">
              <PackageOpen className="h-5 w-5 text-muted-foreground mr-2 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium">Order Total</p>
                <p className="text-sm text-muted-foreground">${delivery.totalPrice.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </CardContent>
        
        {/* Driver Information */}
        {delivery.driver && (
          <CardContent className="border-t pt-4">
            <h3 className="text-lg font-semibold mb-3">Driver Information</h3>
            <div className="flex items-center space-x-4 mb-4">
              <Avatar className="h-12 w-12">
                <AvatarImage src={delivery.driver.avatar} alt={delivery.driver.name} />
                <AvatarFallback>{delivery.driver.name.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{delivery.driver.name}</p>
                <div className="flex items-center mt-1">
                  {renderStarRating(delivery.driver.rating)}
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-2">
              <div className="flex items-center">
                <TruckIcon className="h-4 w-4 text-muted-foreground mr-2" />
                <span className="text-sm">{delivery.driver.vehicleType} • {delivery.driver.licensePlate}</span>
              </div>
              
              <div className="flex items-center">
                <Phone className="h-4 w-4 text-muted-foreground mr-2" />
                <span className="text-sm">{delivery.driver.phone}</span>
              </div>
            </div>
            
            <div className="mt-4 space-y-2">
              <Button variant="outline" className="w-full flex items-center" onClick={() => window.location.href = `tel:${delivery.driver.phone}`}>
                <Phone className="h-4 w-4 mr-2" />
                Call Driver
              </Button>
            </div>
          </CardContent>
        )}
        
        {/* Messages */}
        <CardContent className="border-t pt-4">
          <h3 className="text-lg font-semibold mb-3">Messages</h3>
          
          <div className="border rounded-lg p-3 h-64 overflow-y-auto mb-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                <MessageSquare className="h-8 w-8 mb-2 opacity-50" />
                <p>No messages yet. Send a message to your driver.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => (
                  <div 
                    key={message.id} 
                    className={`flex ${message.sender === 'customer' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div 
                      className={`max-w-[80%] px-4 py-2 rounded-lg ${
                        message.sender === 'customer' 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-muted'
                      }`}
                    >
                      <p className="text-sm">{message.text}</p>
                      <p className="text-xs mt-1 opacity-70">{formatDate(message.timestamp)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="flex space-x-2">
            <input
              type="text"
              placeholder="Type a message..."
              className="flex-1 px-3 py-2 border rounded-md"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            />
            <Button onClick={sendMessage}>Send</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}