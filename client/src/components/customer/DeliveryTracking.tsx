import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'wouter';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Loader2, 
  TruckIcon, 
  MapPinIcon, 
  ClockIcon, 
  MessageCircleIcon,
  PhoneIcon,
  StarIcon,
  ChevronLeftIcon,
  SendIcon
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { 
  useDeliveries, 
  useMessages, 
  useReviews,
  type Delivery 
} from '@/services/delivery.service';
import { useAuth } from '@/services/auth.service';
import { useWebSocket } from '@/services/websocket.service';

// Status component with progress indicator
const DeliveryStatus = ({ delivery }: { delivery: Delivery }) => {
  const statuses = [
    'pending',
    'accepted',
    'picked_up',
    'in_transit',
    'delivered',
    'completed'
  ];
  
  const statusLabels = [
    'Pending',
    'Accepted',
    'Picked Up',
    'In Transit',
    'Delivered',
    'Completed'
  ];
  
  const currentStatusIndex = statuses.indexOf(delivery.status);
  
  return (
    <div className="my-6">
      <div className="flex justify-between mb-2">
        {statusLabels.map((label, index) => (
          <div key={index} className="text-center flex flex-col items-center">
            <div 
              className={`w-8 h-8 rounded-full flex items-center justify-center mb-1
                ${index <= currentStatusIndex ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-400'}`}
            >
              {index <= currentStatusIndex ? (
                <span>✓</span>
              ) : (
                <span>{index + 1}</span>
              )}
            </div>
            <span className={`text-xs ${index <= currentStatusIndex ? 'text-green-500 font-medium' : 'text-gray-400'}`}>
              {label}
            </span>
          </div>
        ))}
      </div>
      <div className="relative h-2 bg-gray-200 rounded">
        <div 
          className="absolute top-0 left-0 h-2 bg-green-500 rounded"
          style={{ width: `${Math.min(100, (currentStatusIndex / (statuses.length - 1)) * 100)}%` }}
        ></div>
      </div>
    </div>
  );
};

// Chat interface component
const ChatInterface = ({
  deliveryId,
  customerId
}: {
  deliveryId: number;
  customerId: number;
}) => {
  const [message, setMessage] = useState('');
  const { getByDeliveryId, create, markAsRead } = useMessages();
  const { data: messages, isLoading } = getByDeliveryId(deliveryId);
  const { toast } = useToast();
  const { sendChatMessage, getDeliveryMessages } = useWebSocket();
  
  // Get real-time messages
  const realtimeMessages = getDeliveryMessages(deliveryId);
  
  // Combine API messages with real-time messages
  const allMessages = React.useMemo(() => {
    if (!messages) return realtimeMessages;
    
    // Create a map of existing message IDs
    const existingMessageIds = new Set(messages.map(m => m.id));
    
    // Filter real-time messages to only include ones not in the API response
    const newRealtimeMessages = realtimeMessages
      .filter(rm => !existingMessageIds.has(rm.message.id));
    
    // Combine and sort all messages by timestamp
    return [
      ...messages,
      ...newRealtimeMessages.map(rm => rm.message)
    ].sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }, [messages, realtimeMessages]);
  
  // Mark unread messages as read
  useEffect(() => {
    if (messages) {
      messages.forEach(message => {
        if (!message.isRead && message.senderId !== customerId) {
          markAsRead.mutate(message.id);
        }
      });
    }
  }, [messages, customerId, markAsRead]);
  
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    
    // Send message both to API and WebSocket
    create.mutate(
      {
        deliveryId,
        senderId: customerId,
        senderType: 'customer',
        content: message
      },
      {
        onSuccess: () => {
          setMessage('');
          // Also send via WebSocket for real-time updates
          sendChatMessage({
            deliveryId,
            senderId: customerId,
            senderType: 'customer',
            content: message
          });
        },
        onError: () => {
          toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Failed to send message. Please try again.',
          });
        }
      }
    );
  };
  
  return (
    <div className="bg-white rounded-lg h-[400px] flex flex-col">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : allMessages && allMessages.length > 0 ? (
          <div className="space-y-4">
            {allMessages.map((msg, index) => (
              <div 
                key={index}
                className={`flex ${msg.senderId === customerId ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-[70%] rounded-lg p-3 ${
                    msg.senderId === customerId
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  <p className="text-sm">{msg.content}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <MessageCircleIcon className="w-12 h-12 text-gray-300 mb-2" />
            <p className="text-gray-500">No messages yet. Start the conversation!</p>
          </div>
        )}
      </div>
      
      {/* Message input */}
      <form onSubmit={handleSendMessage} className="border-t p-4 flex gap-2">
        <Input
          className="flex-1"
          placeholder="Type a message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <Button type="submit" size="icon">
          <SendIcon className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
};

// Review Dialog Component
const ReviewDialog = ({
  deliveryId,
  driverId,
  customerId,
  driverName
}: {
  deliveryId: number;
  driverId: number;
  customerId: number;
  driverName: string;
}) => {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const { create } = useReviews();
  const { toast } = useToast();
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    create.mutate(
      {
        deliveryId,
        driverId,
        customerId,
        rating,
        comment: comment || null
      },
      {
        onSuccess: () => {
          toast({
            title: 'Review Submitted',
            description: 'Thank you for your feedback!',
          });
          setOpen(false);
        },
        onError: () => {
          toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Failed to submit review. Please try again.',
          });
        }
      }
    );
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <StarIcon className="h-4 w-4 mr-2" />
          Rate Driver
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Rate Your Experience</DialogTitle>
          <DialogDescription>
            How was your delivery experience with {driverName}?
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="py-4">
            <div className="flex items-center justify-center space-x-2 mb-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="focus:outline-none"
                >
                  <StarIcon 
                    className={`w-8 h-8 ${
                      rating >= star ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
                    }`} 
                  />
                </button>
              ))}
            </div>
            <div className="space-y-2">
              <Label htmlFor="comment">Additional Comments</Label>
              <Textarea
                id="comment"
                placeholder="Share your experience..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={create.isPending}>
              {create.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Submit Review
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// Main DeliveryTracking component
const DeliveryTracking = () => {
  const { id } = useParams<{ id: string }>();
  const deliveryId = parseInt(id);
  const { user } = useAuth();
  const { toast } = useToast();
  const { getById } = useDeliveries();
  const { connected, authenticate } = useWebSocket();
  
  const { 
    data: delivery,
    isLoading,
    error
  } = getById(deliveryId);
  
  // Connect to WebSocket and authenticate
  useEffect(() => {
    if (connected && user) {
      authenticate(user.id, user.userType);
    }
  }, [connected, authenticate, user]);
  
  // Show error toast if there was an error
  useEffect(() => {
    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load delivery information.',
      });
    }
  }, [error, toast]);

  // Format date to be more readable
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!delivery) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Delivery Not Found</h1>
          <p className="mb-4">The delivery you're looking for doesn't exist or you don't have permission to view it.</p>
          <Link href="/customer/dashboard">
            <Button>
              <ChevronLeftIcon className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const driverName = delivery.driver 
    ? `${delivery.driver.user?.firstName} ${delivery.driver.user?.lastName}`
    : 'Not assigned';

  const driverPhone = delivery.driver?.user?.phoneNumber || 'N/A';

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/customer/dashboard">
          <Button variant="ghost" className="mb-2">
            <ChevronLeftIcon className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Delivery #{delivery.id}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Delivery details column */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Delivery Status</CardTitle>
              <CardDescription>
                Scheduled for {formatDate(delivery.scheduledDate)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DeliveryStatus delivery={delivery} />
              
              <div className="mt-6 space-y-4">
                <div className="flex">
                  <MapPinIcon className="h-5 w-5 text-gray-500 mr-3 mt-0.5" />
                  <div>
                    <h3 className="font-medium">Pickup Location</h3>
                    <p className="text-gray-600">{delivery.pickupAddress}</p>
                  </div>
                </div>
                
                <div className="flex">
                  <MapPinIcon className="h-5 w-5 text-gray-500 mr-3 mt-0.5" />
                  <div>
                    <h3 className="font-medium">Destination</h3>
                    <p className="text-gray-600">{delivery.destinationAddress}</p>
                  </div>
                </div>
                
                <div className="flex">
                  <ClockIcon className="h-5 w-5 text-gray-500 mr-3 mt-0.5" />
                  <div>
                    <h3 className="font-medium">Estimated Delivery Time</h3>
                    <p className="text-gray-600">
                      {delivery.scheduledDate
                        ? formatDate(delivery.scheduledDate)
                        : 'To be determined'}
                    </p>
                  </div>
                </div>
                
                <div className="flex">
                  <TruckIcon className="h-5 w-5 text-gray-500 mr-3 mt-0.5" />
                  <div>
                    <h3 className="font-medium">Items</h3>
                    <p className="text-gray-600">
                      {delivery.items 
                        ? `${delivery.items.length} items`
                        : 'Loading items...'}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <div className="text-xl font-bold">
                ${delivery.totalPrice.toFixed(2)}
              </div>
              {delivery.status === 'completed' && delivery.driver && (
                <ReviewDialog 
                  deliveryId={delivery.id}
                  driverId={delivery.driver.id}
                  customerId={user?.id || 0}
                  driverName={driverName}
                />
              )}
            </CardFooter>
          </Card>
          
          {delivery.items && delivery.items.length > 0 && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {delivery.items.map((item) => (
                    <div key={item.id} className="flex justify-between border-b pb-2">
                      <div>
                        <h4 className="font-medium">
                          {item.furniture?.name || 'Item'}
                        </h4>
                        <p className="text-sm text-gray-500">
                          {item.specialHandling ? 'Requires special handling' : 'Standard handling'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">x{item.quantity}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
        
        {/* Driver info and communication column */}
        <div>
          {delivery.driver ? (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Driver Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center mb-4">
                  <div className="w-20 h-20 rounded-full bg-gray-200 mx-auto mb-3 flex items-center justify-center">
                    {delivery.driver.user?.avatarUrl ? (
                      <img 
                        src={delivery.driver.user.avatarUrl} 
                        alt={driverName}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <TruckIcon className="h-10 w-10 text-gray-400" />
                    )}
                  </div>
                  <h3 className="font-medium text-lg">{driverName}</h3>
                  <p className="text-gray-500">{delivery.driver.vehicleType}</p>
                  {delivery.driver.rating && (
                    <div className="flex items-center justify-center mt-1">
                      <StarIcon className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                      <span className="ml-1">{delivery.driver.rating.toFixed(1)}</span>
                    </div>
                  )}
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <PhoneIcon className="h-4 w-4 text-gray-500 mr-2" />
                      <span>{driverPhone}</span>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <a href={`tel:${driverPhone}`}>Call</a>
                    </Button>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium mb-1">Vehicle Information</p>
                    <p className="text-sm text-gray-500">
                      {delivery.driver.vehicleType} • {delivery.driver.licensePlate}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Driver Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-6">
                  <TruckIcon className="h-12 w-12 text-gray-300 mb-3" />
                  <p className="text-gray-500 text-center">
                    No driver assigned yet. We'll notify you when a driver accepts your delivery.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
          
          <Card>
            <CardHeader>
              <CardTitle>Communication</CardTitle>
              <CardDescription>
                Chat with {delivery.driver ? 'your driver' : 'our support team'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChatInterface 
                deliveryId={delivery.id} 
                customerId={user?.id || 0} 
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DeliveryTracking;