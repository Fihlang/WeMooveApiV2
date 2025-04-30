import DeliveryTracking from "@/components/customer/DeliveryTracking";
import { useParams } from "wouter";

interface DeliveryTrackingPageProps {
  id?: number;
}

export default function DeliveryTrackingPage({ id }: DeliveryTrackingPageProps) {
  // Get the delivery ID from props or URL
  const params = useParams();
  const deliveryId = id || (params && params.id ? parseInt(params.id) : 1); // Fallback to a default ID if no parameter provided
  
  return (
    <div className="container py-12 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-center">Delivery Tracking</h1>
      <DeliveryTracking deliveryId={deliveryId} />
    </div>
  );
}