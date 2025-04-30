import React from 'react';
import { Link } from 'wouter';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from '@/hooks/use-toast';
import { Loader2, Package, MapPin, Calendar, Clock, Truck, ShoppingBag } from 'lucide-react';
import { useAuth } from '@/services/auth.service';
import { useDeliveries } from '@/services/delivery.service';

const DeliveryCard = ({ delivery }: { delivery: any }) => {
  // Format date to be more readable
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Get status color based on delivery status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'accepted':
        return 'bg-blue-100 text-blue-800';
      case 'picked_up':
        return 'bg-purple-100 text-purple-800';
      case 'in_transit':
        return 'bg-indigo-100 text-indigo-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-medium">Delivery #{delivery.id}</CardTitle>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(delivery.status)}`}>
            {delivery.status.charAt(0).toUpperCase() + delivery.status.slice(1).replace('_', ' ')}
          </span>
        </div>
        <CardDescription>
          {formatDate(delivery.scheduledDate)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-start">
            <MapPin className="h-4 w-4 mr-2 mt-0.5 text-gray-500" />
            <div>
              <p className="text-sm font-medium">Pickup</p>
              <p className="text-sm text-gray-500">{delivery.pickupAddress}</p>
            </div>
          </div>
          <div className="flex items-start">
            <MapPin className="h-4 w-4 mr-2 mt-0.5 text-gray-500" />
            <div>
              <p className="text-sm font-medium">Destination</p>
              <p className="text-sm text-gray-500">{delivery.destinationAddress}</p>
            </div>
          </div>
          {delivery.driver && (
            <div className="flex items-start">
              <Truck className="h-4 w-4 mr-2 mt-0.5 text-gray-500" />
              <div>
                <p className="text-sm font-medium">Driver</p>
                <p className="text-sm text-gray-500">
                  {delivery.driver.user?.firstName} {delivery.driver.user?.lastName}
                </p>
              </div>
            </div>
          )}
          <div className="flex items-start">
            <ShoppingBag className="h-4 w-4 mr-2 mt-0.5 text-gray-500" />
            <div>
              <p className="text-sm font-medium">Items</p>
              <p className="text-sm text-gray-500">
                {delivery.items ? delivery.items.length : 'Loading items...'}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="text-md font-semibold">
          ${delivery.totalPrice.toFixed(2)}
        </div>
        <Link href={`/deliveries/${delivery.id}`}>
          <Button variant="outline">Track Delivery</Button>
        </Link>
      </CardFooter>
    </Card>
  );
};

const Dashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const customerId = user?.id;

  const { 
    getActiveByCustomerId,
    getRecentByCustomerId
  } = useDeliveries();

  const { 
    data: activeDeliveries,
    isLoading: isLoadingActive,
    error: activeError
  } = getActiveByCustomerId(customerId!);

  const { 
    data: recentDeliveries,
    isLoading: isLoadingRecent,
    error: recentError
  } = getRecentByCustomerId(customerId!);

  // Show error toast if there was an error
  React.useEffect(() => {
    if (activeError) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load active deliveries.',
      });
    }

    if (recentError) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load recent deliveries.',
      });
    }
  }, [activeError, recentError, toast]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Link href="/deliveries/new">
          <Button>
            <Package className="mr-2 h-4 w-4" />
            Create New Delivery
          </Button>
        </Link>
      </div>

      <Tabs defaultValue="active" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="active">Active Deliveries</TabsTrigger>
          <TabsTrigger value="recent">Recent Deliveries</TabsTrigger>
        </TabsList>
        
        <TabsContent value="active">
          {isLoadingActive ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : activeDeliveries && activeDeliveries.length > 0 ? (
            <div>
              {activeDeliveries.map((delivery) => (
                <DeliveryCard key={delivery.id} delivery={delivery} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <Package className="h-12 w-12 text-gray-300 mb-4" />
                <p className="text-lg font-medium text-center">No active deliveries</p>
                <p className="text-sm text-gray-500 text-center mb-4">
                  You don't have any active deliveries at the moment.
                </p>
                <Link href="/deliveries/new">
                  <Button>Schedule a Delivery</Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="recent">
          {isLoadingRecent ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : recentDeliveries && recentDeliveries.length > 0 ? (
            <div>
              {recentDeliveries.map((delivery) => (
                <DeliveryCard key={delivery.id} delivery={delivery} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <Clock className="h-12 w-12 text-gray-300 mb-4" />
                <p className="text-lg font-medium text-center">No recent deliveries</p>
                <p className="text-sm text-gray-500 text-center">
                  You haven't completed any deliveries yet.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;