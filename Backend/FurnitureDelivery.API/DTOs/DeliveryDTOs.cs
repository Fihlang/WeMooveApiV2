using System.ComponentModel.DataAnnotations;

namespace FurnitureDelivery.API.DTOs
{
    public class CreateDeliveryRequest
    {
        [Required]
        public int CustomerId { get; set; }

        [Required]
        public DateTime ScheduledDate { get; set; }

        [Required]
        [Range(1, double.MaxValue, ErrorMessage = "Total price must be greater than 0")]
        public decimal TotalPrice { get; set; }

        [Required]
        public string PickupAddress { get; set; }

        [Required]
        public string DestinationAddress { get; set; }

        public List<CreateDeliveryItemRequest> Items { get; set; } = new List<CreateDeliveryItemRequest>();

        public string? Notes { get; set; }
        
        public string? PaymentMethod { get; set; }
    }

    public class CreateDeliveryItemRequest
    {
        [Required]
        public int FurnitureId { get; set; }

        [Required]
        [Range(1, int.MaxValue, ErrorMessage = "Quantity must be at least 1")]
        public int Quantity { get; set; }

        public bool SpecialHandling { get; set; } = false;
    }

    public class UpdateDeliveryStatusRequest
    {
        [Required]
        [RegularExpression("pending|assigned|in_transit|delivered|cancelled", 
            ErrorMessage = "Status must be one of: pending, assigned, in_transit, delivered, cancelled")]
        public string Status { get; set; }
    }

    public class AssignDriverRequest
    {
        [Required]
        public int DriverId { get; set; }
    }

    public class DeliveryDTO
    {
        public int Id { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public int CustomerId { get; set; }
        public UserDTO Customer { get; set; }
        public int? DriverId { get; set; }
        public DriverDTO Driver { get; set; }
        public string Status { get; set; }
        public DateTime ScheduledDate { get; set; }
        public decimal TotalPrice { get; set; }
        public string PickupAddress { get; set; }
        public string DestinationAddress { get; set; }
        public string TrackingNumber { get; set; }
        public string Notes { get; set; }
        public double? EstimatedTime { get; set; }
        public double? Distance { get; set; }
        public List<DeliveryItemDTO> Items { get; set; } = new List<DeliveryItemDTO>();
        public PaymentDTO? Payment { get; set; }
    }

    public class DeliveryItemDTO
    {
        public int Id { get; set; }
        public int DeliveryId { get; set; }
        public int FurnitureId { get; set; }
        public FurnitureDTO Furniture { get; set; }
        public int Quantity { get; set; }
        public bool SpecialHandling { get; set; }
    }

    public class FurnitureDTO
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string? Description { get; set; }
        public double Weight { get; set; }
        public object Dimensions { get; set; }
        public string Category { get; set; }
        public string? ImageUrl { get; set; }
    }

    public class PaymentDTO
    {
        public int Id { get; set; }
        public int DeliveryId { get; set; }
        public string Method { get; set; }
        public string Status { get; set; }
        public decimal Amount { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? PaidAt { get; set; }
    }

    public class DriverLocationUpdate
    {
        public int DriverId { get; set; }
        public GeoLocation Location { get; set; }
    }

    public class GeoLocation
    {
        public double Latitude { get; set; }
        public double Longitude { get; set; }
    }

    public class DeliveryStatusUpdate
    {
        public int DeliveryId { get; set; }
        public string Status { get; set; }
    }

    public class WebSocketMessage
    {
        public string Type { get; set; }
        public object Data { get; set; }
    }
}