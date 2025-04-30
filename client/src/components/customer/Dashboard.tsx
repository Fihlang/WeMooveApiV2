import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PackageOpen, Plus, Clock, AlertTriangle, CheckCircle, TruckIcon } from "lucide-react";
import { websocketService } from "@/services/websocket.service";

// Mock user for development
const MOCK_USER = {
  id: 1,
  firstName: "Jane",
  lastName: "Customer"
};

export default function Dashboard() {
  const [activeDeliveries, setActiveDeliveries] = useState<any[]>([]);
  const [recentDeliveries, setRecentDeliveries] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [unreadNotifications, setUnreadNotifications] = useState<number>(0);
  
  useEffect(() => {
    // Load data when component mounts
    fetchData();
    
    // Connect to WebSocket for real-time updates
    const connected = websocketService.connect();
    if (connected) {
      websocketService.authenticate(MOCK_USER.id, 'customer');
    }
    
    // Subscribe to notification updates
    const handleNewNotification = () => {
      setUnreadNotifications(prev => prev + 1);
      fetchActiveDeliveries(); // Refresh deliveries when we get a notification
    };
    
    const removeNotificationHandler = websocketService.on('new_notification', handleNewNotification);
    
    // Cleanup on unmount
    return () => {
      removeNotificationHandler();
      // We don't disconnect from WebSocket here to keep the connection alive across pages
    };
  }, []);
  
  const fetchData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        fetchActiveDeliveries(),
        fetchRecentDeliveries(),
        fetchUnreadNotifications()
      ]);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to load your dashboard. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const fetchActiveDeliveries = async () => {
    try {
      const response = await fetch(`/api/customers/${MOCK_USER.id}/deliveries/active`);
      if (response.ok) {
        const data = await response.json();
        setActiveDeliveries(data);
      } else {
        console.error('Failed to fetch active deliveries');
      }
    } catch (error) {
      console.error('Error fetching active deliveries:', error);
    }
  };
  
  const fetchRecentDeliveries = async () => {
    try {
      const response = await fetch(`/api/customers/${MOCK_USER.id}/deliveries/recent`);
      if (response.ok) {
        const data = await response.json();
        setRecentDeliveries(data);
      } else {
        console.error('Failed to fetch recent deliveries');
      }
    } catch (error) {
      console.error('Error fetching recent deliveries:', error);
    }
  };
  
  const fetchUnreadNotifications = async () => {
    try {
      const response = await fetch(`/api/users/${MOCK_USER.id}/notifications/unread`);
      if (response.ok) {
        const data = await response.json();
        setUnreadNotifications(data.length);
      } else {
        console.error('Failed to fetch unread notifications');
      }
    } catch (error) {
      console.error('Error fetching unread notifications:', error);
    }
  };
  
  // Helper function to get status badge color
  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { color: string, icon: JSX.Element }> = {
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
  
  // Format date in a user-friendly way
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (error) {
      return dateString;
    }
  };
  
  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Customer Dashboard</h1>
          <p className="text-gray-500">Welcome back, {MOCK_USER.firstName} {MOCK_USER.lastName}</p>
        </div>
        <div className="flex gap-4">
          <Button asChild>
            <Link href="/order">
              <Plus className="mr-2 h-4 w-4" />
              New Delivery
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/notifications">
              Notifications
              {unreadNotifications > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {unreadNotifications}
                </Badge>
              )}
            </Link>
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="active" className="space-y-6">
        <TabsList>
          <TabsTrigger value="active">Active Deliveries</TabsTrigger>
          <TabsTrigger value="recent">Recent Deliveries</TabsTrigger>
        </TabsList>
        
        <TabsContent value="active" className="space-y-4">
          {isLoading ? (
            <div className="text-center p-6">Loading active deliveries...</div>
          ) : activeDeliveries.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <PackageOpen className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-xl font-medium mb-2">No active deliveries</p>
                <p className="text-gray-500 mb-4">You don't have any active furniture deliveries at the moment.</p>
                <Button asChild>
                  <Link href="/order">
                    <Plus className="mr-2 h-4 w-4" />
                    Schedule a Delivery
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {activeDeliveries.map((delivery) => (
                <Card key={delivery.id}>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-center">
                      <CardTitle>Delivery #{delivery.id}</CardTitle>
                      {getStatusBadge(delivery.status)}
                    </div>
                    <CardDescription>
                      Created on {formatDate(delivery.createdAt)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2 pb-3">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">From:</span>
                      <span className="text-sm text-right">{delivery.pickupAddress}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">To:</span>
                      <span className="text-sm text-right">{delivery.destinationAddress}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Items:</span>
                      <span className="text-sm">{delivery.items?.length || 0} items</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Price:</span>
                      <span className="text-sm">${delivery.totalPrice.toFixed(2)}</span>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button className="w-full" asChild>
                      <Link href={`/tracking/${delivery.id}`}>
                        Track Delivery
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="recent">
          {isLoading ? (
            <div className="text-center p-6">Loading recent deliveries...</div>
          ) : recentDeliveries.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <PackageOpen className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-xl font-medium mb-2">No recent deliveries</p>
                <p className="text-gray-500 mb-4">You haven't had any deliveries recently.</p>
                <Button asChild>
                  <Link href="/order">
                    <Plus className="mr-2 h-4 w-4" />
                    Schedule a Delivery
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Recent Deliveries</CardTitle>
                <CardDescription>
                  Your completed deliveries from the past 30 days
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Destination</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentDeliveries.map((delivery) => (
                      <TableRow key={delivery.id}>
                        <TableCell>#{delivery.id}</TableCell>
                        <TableCell>{formatDate(delivery.createdAt)}</TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {delivery.destinationAddress}
                        </TableCell>
                        <TableCell>{getStatusBadge(delivery.status)}</TableCell>
                        <TableCell>${delivery.totalPrice.toFixed(2)}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/deliveries/${delivery.id}`}>
                              Details
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}