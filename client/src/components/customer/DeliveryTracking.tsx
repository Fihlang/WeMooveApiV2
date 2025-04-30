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
    const statusMap: Record<DeliveryStatus, { color: string, bgColor: string, icon: JSX.Element }> = {
      'pending': { 
        color: 'text-gray-700',
        bgColor: 'bg-gray-100', 
        icon: <Clock className="h-3 w-3" /> 
      },
      'driver_assigned': { 
        color: 'text-indigo-700',
        bgColor: 'bg-indigo-100', 
        icon: <TruckIcon className="h-3 w-3" /> 
      },
      'picked_up': { 
        color: 'text-blue-700',
        bgColor: 'bg-blue-100', 
        icon: <PackageOpen className="h-3 w-3" /> 
      },
      'in_transit': { 
        color: 'text-violet-700',
        bgColor: 'bg-violet-100', 
        icon: <TruckIcon className="h-3 w-3" /> 
      },
      'out_for_delivery': { 
        color: 'text-purple-700',
        bgColor: 'bg-purple-100', 
        icon: <TruckIcon className="h-3 w-3" /> 
      },
      'delivered': { 
        color: 'text-green-700',
        bgColor: 'bg-green-100', 
        icon: <CheckCircle className="h-3 w-3" /> 
      },
      'cancelled': { 
        color: 'text-red-700',
        bgColor: 'bg-red-100', 
        icon: <AlertTriangle className="h-3 w-3" /> 
      }
    };
    
    const statusInfo = statusMap[status] || { color: 'text-gray-700', bgColor: 'bg-gray-100', icon: <Clock className="h-3 w-3" /> };
    const label = status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    
    return (
      <Badge className={`${statusInfo.color} ${statusInfo.bgColor} hover:${statusInfo.bgColor} flex items-center gap-1.5 py-1.5 px-3 rounded-full border-0`}>
        {statusInfo.icon}
        <span className="font-medium">{label}</span>
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
        
        <CardContent className="pb-6 space-y-6">
          {/* Delivery Progress */}
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-xl p-4 shadow-sm border border-slate-100 dark:border-slate-800">
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-medium">Delivery Progress</h4>
              <Badge variant={delivery.status === 'delivered' ? 'success' : 'secondary'} className="px-2.5 py-0.5 rounded-full">
                {delivery.status === 'delivered' ? 'Completed' : 'In Progress'}
              </Badge>
            </div>
            <Progress 
              value={getProgressValue(delivery.status)} 
              className="h-3 mt-2" 
              indicatorClassName="bg-gradient-to-r from-primary to-secondary"
            />
            
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              <span>Order Placed</span>
              <span>Out for Delivery</span>
              <span>Delivered</span>
            </div>
          </div>
          
          {/* Delivery Details */}
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-xl p-4 shadow-sm border border-slate-100 dark:border-slate-800">
            <h4 className="font-medium mb-4">Delivery Details</h4>
            
            <div className="grid grid-cols-1 gap-3 mt-2">
              <div className="flex items-start bg-white dark:bg-slate-900 rounded-lg p-3 border border-slate-100 dark:border-slate-800">
                <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center mr-3 mt-0.5">
                  <MapPin className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <p className="text-sm font-medium">Pickup Location</p>
                  <p className="text-sm text-muted-foreground">{delivery.pickupAddress}</p>
                </div>
              </div>
              
              <div className="flex items-start bg-white dark:bg-slate-900 rounded-lg p-3 border border-slate-100 dark:border-slate-800">
                <div className="h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center mr-3 mt-0.5">
                  <MapPin className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-sm font-medium">Delivery Location</p>
                  <p className="text-sm text-muted-foreground">{delivery.destinationAddress}</p>
                </div>
              </div>
              
              <div className="flex items-start bg-white dark:bg-slate-900 rounded-lg p-3 border border-slate-100 dark:border-slate-800">
                <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mr-3 mt-0.5">
                  <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-medium">Scheduled Delivery Date</p>
                  <p className="text-sm text-muted-foreground">{formatDate(delivery.scheduledDate)}</p>
                </div>
              </div>
              
              {delivery.tracking && delivery.tracking.estimatedArrival && (
                <div className="flex items-start bg-white dark:bg-slate-900 rounded-lg p-3 border border-slate-100 dark:border-slate-800">
                  <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mr-3 mt-0.5">
                    <Clock className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Estimated Arrival</p>
                    <p className="text-sm text-muted-foreground">{formatDate(delivery.tracking.estimatedArrival)}</p>
                  </div>
                </div>
              )}
              
              <div className="flex items-start bg-white dark:bg-slate-900 rounded-lg p-3 border border-slate-100 dark:border-slate-800">
                <div className="h-8 w-8 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center mr-3 mt-0.5">
                  <PackageOpen className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-sm font-medium">Order Total</p>
                  <p className="text-sm font-medium text-primary">${delivery.totalPrice.toFixed(2)}</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
        
        {/* Driver Information */}
        {delivery.driver && (
          <CardContent className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Driver Information</h3>
            <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-xl p-4 shadow-sm border border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-4 mb-4">
                <Avatar className="h-16 w-16 border-2 border-primary/20 shadow-md">
                  <AvatarImage src={delivery.driver.avatar} alt={delivery.driver.name} />
                  <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white">
                    {delivery.driver.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-lg">{delivery.driver.name}</p>
                  <div className="flex items-center mt-1.5">
                    {renderStarRating(delivery.driver.rating)}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-3 mt-4 mb-5">
                <div className="flex items-center p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800">
                  <TruckIcon className="h-5 w-5 text-primary mr-3" />
                  <div>
                    <p className="text-xs text-muted-foreground">Vehicle</p>
                    <p className="text-sm font-medium">{delivery.driver.vehicleType} • {delivery.driver.licensePlate}</p>
                  </div>
                </div>
                
                <div className="flex items-center p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800">
                  <Phone className="h-5 w-5 text-primary mr-3" />
                  <div>
                    <p className="text-xs text-muted-foreground">Contact</p>
                    <p className="text-sm font-medium">{delivery.driver.phone}</p>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  variant="outline" 
                  className="w-full flex items-center justify-center py-5" 
                  onClick={() => window.location.href = `tel:${delivery.driver.phone}`}
                >
                  <Phone className="h-4 w-4 mr-2" />
                  Call Driver
                </Button>
                <Button 
                  className="w-full flex items-center justify-center py-5 bg-gradient-to-r from-primary to-secondary hover:opacity-90" 
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Message
                </Button>
              </div>
            </div>
          </CardContent>
        )}
        
        {/* Messages */}
        <CardContent className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-4">Messages</h3>
          
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-xl p-4 shadow-sm border border-slate-100 dark:border-slate-800">
            <div className="bg-white dark:bg-slate-900 rounded-lg p-0.5 mb-4 border border-slate-200 dark:border-slate-700">
              <div className="h-72 overflow-y-auto p-4">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                    <div className="bg-primary/10 rounded-full p-4 mb-3">
                      <MessageSquare className="h-8 w-8 text-primary" />
                    </div>
                    <p className="font-medium text-slate-600 dark:text-slate-300">No messages yet</p>
                    <p className="text-sm text-muted-foreground mt-1">Send a message to your driver below</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {messages.map((message) => (
                      <div 
                        key={message.id} 
                        className={`flex ${message.sender === 'customer' ? 'justify-end' : 'justify-start'}`}
                      >
                        {message.sender === 'driver' && (
                          <Avatar className="h-8 w-8 mr-2">
                            <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white text-xs">
                              {delivery.driver?.name.slice(0, 2).toUpperCase() || 'DR'}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <div 
                          className={`max-w-[75%] px-4 py-3 rounded-2xl shadow-sm ${
                            message.sender === 'customer' 
                              ? 'bg-gradient-to-r from-primary to-secondary text-primary-foreground rounded-tr-none' 
                              : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-tl-none'
                          }`}
                        >
                          <p className="text-sm leading-relaxed">{message.text}</p>
                          <p className="text-xs mt-1.5 opacity-70">{formatDate(message.timestamp)}</p>
                        </div>
                        {message.sender === 'customer' && (
                          <Avatar className="h-8 w-8 ml-2">
                            <AvatarFallback className="bg-gradient-to-br from-secondary to-primary text-white text-xs">
                              YOU
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            <div className="relative">
              <input
                type="text"
                placeholder="Type a message..."
                className="w-full px-4 py-3.5 pr-[120px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-full focus:ring-primary focus:border-primary shadow-sm"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              />
              <Button 
                onClick={sendMessage} 
                className="absolute right-1.5 top-1.5 rounded-full px-4 py-2 h-auto bg-gradient-to-r from-primary to-secondary hover:opacity-90"
                disabled={!newMessage.trim()}
              >
                <MessageSquare className="h-4 w-4 mr-1.5" />
                Send
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}