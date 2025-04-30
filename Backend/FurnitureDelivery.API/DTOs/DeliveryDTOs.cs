using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace FurnitureDelivery.API.DTOs
{
    public class DriverDTO
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string VehicleType { get; set; }
        public string LicensePlate { get; set; }
        public string Capacity { get; set; }
        public double? Rating { get; set; }
        public bool IsAvailable { get; set; }
        public double? CurrentLatitude { get; set; }
        public double? CurrentLongitude { get; set; }
        public string VerificationStatus { get; set; }
        public UserDTO User { get; set; }
    }
    
    public class DeliveryItemDTO
    {
        public int Id { get; set; }
        public int DeliveryId { get; set; }
        public int FurnitureId { get; set; }
        public int Quantity { get; set; }
        public bool SpecialHandling { get; set; }
        public FurnitureDTO Furniture { get; set; }
    }
    
    public class FurnitureDTO
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
        public double Weight { get; set; }
        public object Dimensions { get; set; }
        public string Category { get; set; }
        public string ImageUrl { get; set; }
    }
    
    public class CreateDeliveryDTO
    {
        [Required]
        public int CustomerId { get; set; }
        
        [Required]
        public DateTime ScheduledDate { get; set; }
        
        [Required]
        public decimal TotalPrice { get; set; }
        
        [Required]
        public string PickupAddress { get; set; }
        
        [Required]
        public string DestinationAddress { get; set; }
        
        [Required]
        public List<CreateDeliveryItemDTO> Items { get; set; }
        
        public string Notes { get; set; }
        
        public string SpecialInstructions { get; set; }
    }
    
    public class CreateDeliveryItemDTO
    {
        [Required]
        public int FurnitureId { get; set; }
        
        [Required]
        [Range(1, int.MaxValue, ErrorMessage = "Quantity must be at least 1")]
        public int Quantity { get; set; }
        
        public bool SpecialHandling { get; set; }
    }
    
    public class UpdateDeliveryStatusDTO
    {
        [Required]
        [RegularExpression("pending|assigned|in_transit|delivered|cancelled", 
                          ErrorMessage = "Status must be 'pending', 'assigned', 'in_transit', 'delivered', or 'cancelled'")]
        public string Status { get; set; }
    }
    
    public class AssignDriverDTO
    {
        [Required]
        public int DriverId { get; set; }
    }
    
    public class DriverLocationUpdateDTO
    {
        [Required]
        [Range(-90, 90, ErrorMessage = "Latitude must be between -90 and 90")]
        public double Latitude { get; set; }
        
        [Required]
        [Range(-180, 180, ErrorMessage = "Longitude must be between -180 and 180")]
        public double Longitude { get; set; }
    }
    
    public class DeliveryDTO
    {
        public int Id { get; set; }
        public int CustomerId { get; set; }
        public int? DriverId { get; set; }
        public string Status { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public DateTime ScheduledDate { get; set; }
        public decimal TotalPrice { get; set; }
        public string PickupAddress { get; set; }
        public string DestinationAddress { get; set; }
        public string TrackingNumber { get; set; }
        public string Notes { get; set; }
        public string SpecialInstructions { get; set; }
        public double? EstimatedDuration { get; set; }
        public double? Distance { get; set; }
        public UserDTO Customer { get; set; }
        public DriverDTO Driver { get; set; }
        public List<DeliveryItemDTO> Items { get; set; }
        public PaymentDTO Payment { get; set; }
        public List<MessageDTO> Messages { get; set; }
        public List<ReviewDTO> Reviews { get; set; }
    }
    
    public class PaymentDTO
    {
        public int Id { get; set; }
        public int DeliveryId { get; set; }
        public decimal Amount { get; set; }
        public string Status { get; set; }
        public string PaymentMethod { get; set; }
        public string TransactionId { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? CompletedAt { get; set; }
    }
    
    public class MessageDTO
    {
        public int Id { get; set; }
        public int DeliveryId { get; set; }
        public int SenderId { get; set; }
        public string SenderType { get; set; }
        public string Content { get; set; }
        public DateTime CreatedAt { get; set; }
        public bool IsRead { get; set; }
    }
    
    public class CreateMessageDTO
    {
        [Required]
        public int DeliveryId { get; set; }
        
        [Required]
        public int SenderId { get; set; }
        
        [Required]
        [RegularExpression("customer|driver|admin|system", 
                          ErrorMessage = "SenderType must be 'customer', 'driver', 'admin', or 'system'")]
        public string SenderType { get; set; }
        
        [Required]
        public string Content { get; set; }
    }
    
    public class ReviewDTO
    {
        public int Id { get; set; }
        public int DeliveryId { get; set; }
        public int CustomerId { get; set; }
        public int DriverId { get; set; }
        public int Rating { get; set; }
        public string Comment { get; set; }
        public DateTime CreatedAt { get; set; }
        public UserDTO Customer { get; set; }
        public DriverDTO Driver { get; set; }
    }
    
    public class CreateReviewDTO
    {
        [Required]
        public int DeliveryId { get; set; }
        
        [Required]
        public int CustomerId { get; set; }
        
        [Required]
        public int DriverId { get; set; }
        
        [Required]
        [Range(1, 5, ErrorMessage = "Rating must be between 1 and 5")]
        public int Rating { get; set; }
        
        public string Comment { get; set; }
    }
    
    public class NotificationDTO
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string Type { get; set; }
        public string Title { get; set; }
        public string Message { get; set; }
        public bool IsRead { get; set; }
        public string RelatedEntityType { get; set; }
        public int? RelatedEntityId { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}