using System.Text.Json.Serialization;

namespace FurnitureDelivery.API.DTOs
{
    // Furniture DTO
    public class FurnitureDTO
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public double Weight { get; set; }
        public object Dimensions { get; set; } = null!;
        public string Category { get; set; } = string.Empty;
        public string? ImageUrl { get; set; }
    }

    // Delivery Item DTO
    public class DeliveryItemDTO
    {
        public int Id { get; set; }
        public int DeliveryId { get; set; }
        public int FurnitureId { get; set; }
        public FurnitureDTO? Furniture { get; set; }
        public int Quantity { get; set; }
        public bool SpecialHandling { get; set; }
    }

    // Delivery DTO
    public class DeliveryDTO
    {
        public int Id { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public int CustomerId { get; set; }
        public UserDTO? Customer { get; set; }
        public int? DriverId { get; set; }
        public DriverDTO? Driver { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime ScheduledDate { get; set; }
        public double TotalPrice { get; set; }
        public string PickupAddress { get; set; } = string.Empty;
        public string DestinationAddress { get; set; } = string.Empty;
        public string? Notes { get; set; }
        public double? Distance { get; set; }
        public double? Duration { get; set; }
        public string? TrackingCode { get; set; }
        public string? PaymentStatus { get; set; }
        public bool IsReviewed { get; set; }
        public List<DeliveryItemDTO> Items { get; set; } = new List<DeliveryItemDTO>();
    }

    // Create Delivery Request
    public class CreateDeliveryRequest
    {
        public DateTime ScheduledDate { get; set; }
        public string PickupAddress { get; set; } = string.Empty;
        public string DestinationAddress { get; set; } = string.Empty;
        public string? Notes { get; set; }
        public List<CreateDeliveryItemRequest> Items { get; set; } = new List<CreateDeliveryItemRequest>();
    }

    // Create Delivery Item Request
    public class CreateDeliveryItemRequest
    {
        public int FurnitureId { get; set; }
        public int Quantity { get; set; }
        public bool SpecialHandling { get; set; }
    }

    // Update Delivery Status Request
    public class UpdateDeliveryStatusRequest
    {
        public string Status { get; set; } = string.Empty;
    }

    // Assign Driver Request
    public class AssignDriverRequest
    {
        public int DriverId { get; set; }
    }

    // Payment DTO
    public class PaymentDTO
    {
        public int Id { get; set; }
        public DateTime CreatedAt { get; set; }
        public int DeliveryId { get; set; }
        public double Amount { get; set; }
        public string PaymentMethod { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string? TransactionId { get; set; }
    }

    // Create Payment Request
    public class CreatePaymentRequest
    {
        public int DeliveryId { get; set; }
        public double Amount { get; set; }
        public string PaymentMethod { get; set; } = string.Empty;
    }

    // Review DTO
    public class ReviewDTO
    {
        public int Id { get; set; }
        public DateTime CreatedAt { get; set; }
        public int DeliveryId { get; set; }
        public int CustomerId { get; set; }
        public UserDTO? Customer { get; set; }
        public int DriverId { get; set; }
        public DriverDTO? Driver { get; set; }
        public int Rating { get; set; }
        public string? Comment { get; set; }
    }

    // Create Review Request
    public class CreateReviewRequest
    {
        public int DeliveryId { get; set; }
        public int DriverId { get; set; }
        public int Rating { get; set; }
        public string? Comment { get; set; }
    }

    // Message DTO
    public class MessageDTO
    {
        public int Id { get; set; }
        public DateTime CreatedAt { get; set; }
        public int DeliveryId { get; set; }
        public int SenderId { get; set; }
        public UserDTO? Sender { get; set; }
        public int RecipientId { get; set; }
        public UserDTO? Recipient { get; set; }
        public string Content { get; set; } = string.Empty;
        public bool IsRead { get; set; }
    }

    // Send Message Request
    public class SendMessageRequest
    {
        public int DeliveryId { get; set; }
        public int RecipientId { get; set; }
        public string Content { get; set; } = string.Empty;
    }

    // Notification DTO
    public class NotificationDTO
    {
        public int Id { get; set; }
        public DateTime CreatedAt { get; set; }
        public int UserId { get; set; }
        public string Type { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public bool IsRead { get; set; }
        public string? RelatedEntityType { get; set; }
        public int? RelatedEntityId { get; set; }
    }
}