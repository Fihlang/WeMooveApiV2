namespace FurnitureDelivery.API.DTOs
{
    // WebSocket Message
    public class WebSocketMessage
    {
        public string Type { get; set; } = string.Empty;
        public object? Data { get; set; }
    }

    // Dashboard Summary DTO for Customers
    public class CustomerDashboardDTO
    {
        public int TotalDeliveries { get; set; }
        public int ActiveDeliveries { get; set; }
        public int CompletedDeliveries { get; set; }
        public List<DeliveryDTO> RecentDeliveries { get; set; } = new List<DeliveryDTO>();
        public List<DeliveryDTO> UpcomingDeliveries { get; set; } = new List<DeliveryDTO>();
        public List<NotificationDTO> Notifications { get; set; } = new List<NotificationDTO>();
    }

    // Dashboard Summary DTO for Drivers
    public class DriverDashboardDTO
    {
        public bool IsAvailable { get; set; }
        public string VerificationStatus { get; set; } = string.Empty;
        public double? Rating { get; set; }
        public int TotalDeliveries { get; set; }
        public int ActiveDeliveries { get; set; }
        public int CompletedDeliveries { get; set; }
        public double TotalEarnings { get; set; }
        public List<DeliveryDTO> CurrentDeliveries { get; set; } = new List<DeliveryDTO>();
        public List<DeliveryDTO> UpcomingDeliveries { get; set; } = new List<DeliveryDTO>();
        public List<ReviewDTO> RecentReviews { get; set; } = new List<ReviewDTO>();
        public List<NotificationDTO> Notifications { get; set; } = new List<NotificationDTO>();
    }

    // Dashboard Summary DTO for Admins
    public class AdminDashboardDTO
    {
        public int TotalUsers { get; set; }
        public int TotalCustomers { get; set; }
        public int TotalDrivers { get; set; }
        public int TotalDeliveries { get; set; }
        public int PendingDriverVerifications { get; set; }
        public int ActiveDeliveries { get; set; }
        public double TotalRevenue { get; set; }
        public List<DeliveryDTO> RecentDeliveries { get; set; } = new List<DeliveryDTO>();
        public List<DriverDTO> PendingDrivers { get; set; } = new List<DriverDTO>();
    }

    // Location Update DTO
    public class LocationUpdateDTO
    {
        public int DriverId { get; set; }
        public int UserId { get; set; }
        public string DriverName { get; set; } = string.Empty;
        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public DateTime Timestamp { get; set; }
    }

    // Status Update DTO
    public class StatusUpdateDTO
    {
        public int DeliveryId { get; set; }
        public string Status { get; set; } = string.Empty;
        public string PreviousStatus { get; set; } = string.Empty;
        public DateTime UpdatedAt { get; set; }
    }

    // Statistics DTO
    public class StatisticsDTO
    {
        public int TotalDeliveries { get; set; }
        public int CompletedDeliveries { get; set; }
        public int CancelledDeliveries { get; set; }
        public double AverageRating { get; set; }
        public double TotalRevenue { get; set; }
        public Dictionary<string, int> DeliveriesByStatus { get; set; } = new Dictionary<string, int>();
        public Dictionary<string, int> DeliveriesByMonth { get; set; } = new Dictionary<string, int>();
    }

    // Rate Calculation Request
    public class RateCalculationRequest
    {
        public string PickupAddress { get; set; } = string.Empty;
        public string DestinationAddress { get; set; } = string.Empty;
        public List<RateCalculationItem> Items { get; set; } = new List<RateCalculationItem>();
    }

    // Rate Calculation Item
    public class RateCalculationItem
    {
        public int FurnitureId { get; set; }
        public int Quantity { get; set; }
        public bool SpecialHandling { get; set; }
    }

    // Rate Calculation Response
    public class RateCalculationResponse
    {
        public double BaseRate { get; set; }
        public double DistanceRate { get; set; }
        public double WeightRate { get; set; }
        public double SpecialHandlingRate { get; set; }
        public double TotalRate { get; set; }
        public double Distance { get; set; }
        public double Duration { get; set; }
        public string Currency { get; set; } = "USD";
    }
}