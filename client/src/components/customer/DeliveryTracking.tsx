import { useState, useEffect } from "react";
import { websocketService } from "@/services/websocket.service";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import { Clock, Truck, MapPin, MessageSquare } from "lucide-react";

interface DeliveryTrackingProps {
  deliveryId: number;
  initialStatus?: string;
}

export default function DeliveryTracking({ deliveryId, initialStatus = "pending" }: DeliveryTrackingProps) {
  const [delivery, setDelivery] = useState<any | null>(null);
  const [status, setStatus] = useState<string>(initialStatus);
  const [driverLocation, setDriverLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [estimatedArrival, setEstimatedArrival] = useState<string | null>(null);
  const [progressValue, setProgressValue] = useState<number>(0);

  // Connect to WebSocket and subscribe to delivery updates
  useEffect(() => {
    // Initialize connection
    if (!isConnected) {
      const success = websocketService.connect();
      if (success) {
        console.log("WebSocket connection initialized");
      }
    }

    // Setup event handlers
    const connectedHandler = () => {
      setIsConnected(true);
      console.log("WebSocket connected");
      
      // Subscribe to this delivery
      websocketService.subscribeToDelivery(deliveryId);
      
      // Fetch initial delivery data
      fetchDeliveryData();
    };
    
    const disconnectedHandler = () => {
      setIsConnected(false);
      console.log("WebSocket disconnected");
    };
    
    const statusUpdateHandler = (data: any) => {
      console.log("Delivery status update:", data);
      if (data && data.status) {
        setStatus(data.status);
        updateProgressValue(data.status);
        
        if (data.estimatedArrival) {
          setEstimatedArrival(data.estimatedArrival);
        }
        
        toast({
          title: "Delivery Status Updated",
          description: `Your delivery is now ${data.status}`,
        });
      }
    };
    
    const locationUpdateHandler = (data: any) => {
      console.log("Driver location update:", data);
      if (data && data.latitude && data.longitude) {
        setDriverLocation({
          latitude: data.latitude,
          longitude: data.longitude
        });
        
        if (data.estimatedArrival) {
          setEstimatedArrival(data.estimatedArrival);
        }
      }
    };

    // Register handlers
    const removeConnectedHandler = websocketService.on('connected', connectedHandler);
    const removeDisconnectedHandler = websocketService.on('disconnected', disconnectedHandler);
    const removeStatusUpdateHandler = websocketService.on('delivery_status_update', statusUpdateHandler);
    const removeLocationUpdateHandler = websocketService.on('driver_location_update', locationUpdateHandler);

    // Clean up on unmount
    return () => {
      removeConnectedHandler();
      removeDisconnectedHandler();
      removeStatusUpdateHandler();
      removeLocationUpdateHandler();
    };
  }, [deliveryId]);

  // Fetch delivery data from API
  const fetchDeliveryData = async () => {
    try {
      const response = await fetch(`/api/deliveries/${deliveryId}`);
      if (response.ok) {
        const data = await response.json();
        setDelivery(data);
        setStatus(data.status);
        updateProgressValue(data.status);
        
        // If we have driver location info in the delivery data
        if (data.driver && data.driver.currentLatitude && data.driver.currentLongitude) {
          setDriverLocation({
            latitude: data.driver.currentLatitude,
            longitude: data.driver.currentLongitude
          });
        }
        
        // If delivery has an estimated arrival time
        if (data.estimatedArrival) {
          setEstimatedArrival(data.estimatedArrival);
        }
      } else {
        console.error("Failed to fetch delivery data");
        toast({
          title: "Error",
          description: "Failed to load delivery information",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching delivery data:", error);
      toast({
        title: "Error",
        description: "Failed to load delivery information",
        variant: "destructive",
      });
    }
  };

  // Update progress bar based on status
  const updateProgressValue = (currentStatus: string) => {
    const statusMap: Record<string, number> = {
      'pending': 0,
      'driver_assigned': 20,
      'picked_up': 40,
      'in_transit': 60,
      'out_for_delivery': 80,
      'delivered': 100,
      'cancelled': 0
    };
    
    setProgressValue(statusMap[currentStatus] || 0);
  };

  // Helper function to get a human-readable status
  const getReadableStatus = (statusCode: string): string => {
    const statusMap: Record<string, string> = {
      'pending': 'Pending',
      'driver_assigned': 'Driver Assigned',
      'picked_up': 'Picked Up',
      'in_transit': 'In Transit',
      'out_for_delivery': 'Out for Delivery',
      'delivered': 'Delivered',
      'cancelled': 'Cancelled'
    };
    
    return statusMap[statusCode] || statusCode;
  };

  // Helper function to get status badge color
  const getStatusColor = (statusCode: string): string => {
    const statusColorMap: Record<string, string> = {
      'pending': 'bg-gray-500',
      'driver_assigned': 'bg-blue-500',
      'picked_up': 'bg-cyan-500',
      'in_transit': 'bg-indigo-500',
      'out_for_delivery': 'bg-purple-500',
      'delivered': 'bg-green-500',
      'cancelled': 'bg-red-500'
    };
    
    return statusColorMap[statusCode] || 'bg-gray-500';
  };

  // Format the estimated arrival time
  const formatEstimatedArrival = () => {
    if (!estimatedArrival) return 'Not available';
    
    try {
      const date = new Date(estimatedArrival);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (error) {
      return estimatedArrival;
    }
  };

  const openChat = () => {
    // This would be implemented to open a chat interface
    toast({
      title: "Chat Feature",
      description: "Chat functionality would open here",
    });
  };

  const viewMap = () => {
    // This would be implemented to show a detailed map
    if (driverLocation) {
      toast({
        title: "Map View",
        description: `Driver location: ${driverLocation.latitude}, ${driverLocation.longitude}`,
      });
    } else {
      toast({
        title: "Map View",
        description: "Driver location not available yet",
      });
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Delivery #{deliveryId}</span>
          <Badge className={getStatusColor(status)}>
            {getReadableStatus(status)}
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="mb-6">
          <Progress value={progressValue} className="h-2" />
        </div>
        
        {delivery && (
          <div className="space-y-3">
            <div className="flex justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium">Estimated Arrival:</span>
              </div>
              <span className="text-sm">{formatEstimatedArrival()}</span>
            </div>
            
            <div className="flex justify-between">
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium">Driver:</span>
              </div>
              <span className="text-sm">
                {delivery.driver ? `${delivery.driver.user.firstName} ${delivery.driver.user.lastName}` : 'Not assigned yet'}
              </span>
            </div>
            
            <div className="flex justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium">Destination:</span>
              </div>
              <span className="text-sm truncate max-w-[200px]">{delivery.destinationAddress}</span>
            </div>
          </div>
        )}
        
        <div className="pt-2">
          <div className="text-xs text-gray-500 flex items-center justify-center gap-2">
            <span className={isConnected ? "text-green-500" : "text-red-500"}>●</span>
            <span>{isConnected ? "Live Updates Active" : "Connecting..."}</span>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between gap-4">
        <Button variant="outline" className="w-full" onClick={openChat}>
          <MessageSquare className="mr-2 h-4 w-4" />
          Chat
        </Button>
        <Button className="w-full" onClick={viewMap}>
          <MapPin className="mr-2 h-4 w-4" />
          View Map
        </Button>
      </CardFooter>
    </Card>
  );
}