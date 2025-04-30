using System;
using System.ComponentModel.DataAnnotations;

namespace FurnitureDelivery.API.DTOs
{
    // Driver DTOs
    public class DriverDTO
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public UserDTO User { get; set; }
        public string VehicleType { get; set; }
        public string LicensePlate { get; set; }
        public string Capacity { get; set; }
        public bool IsAvailable { get; set; }
        public double? CurrentLatitude { get; set; }
        public double? CurrentLongitude { get; set; }
        public double? Rating { get; set; }
        public string VerificationStatus { get; set; }
    }
    
    public class UpdateDriverLocationDTO
    {
        [Required]
        public double Latitude { get; set; }
        
        [Required]
        public double Longitude { get; set; }
    }
    
    // Furniture DTOs
    public class FurnitureDTO
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
        public double Weight { get; set; }
        public DimensionsDTO Dimensions { get; set; }
        public string Category { get; set; }
        public string ImageUrl { get; set; }
    }
    
    public class DimensionsDTO
    {
        public double Length { get; set; }
        public double Width { get; set; }
        public double Height { get; set; }
    }
    
    public class CreateFurnitureDTO
    {
        [Required]
        public string Name { get; set; }
        
        public string Description { get; set; }
        
        [Required]
        [Range(0.1, double.MaxValue)]
        public double Weight { get; set; }
        
        [Required]
        public DimensionsDTO Dimensions { get; set; }
        
        [Required]
        public string Category { get; set; }
        
        public string ImageUrl { get; set; }
    }
    
    // Message DTOs
    public class MessageDTO
    {
        public int Id { get; set; }
        public int DeliveryId { get; set; }
        public int SenderId { get; set; }
        public string SenderType { get; set; }
        public string SenderName { get; set; }
        public string Content { get; set; }
        public DateTime CreatedAt { get; set; }
        public bool IsRead { get; set; }
    }
    
    public class SendMessageDTO
    {
        [Required]
        public int DeliveryId { get; set; }
        
        [Required]
        public string Content { get; set; }
    }
    
    // Review DTOs
    public class ReviewDTO
    {
        public int Id { get; set; }
        public int DeliveryId { get; set; }
        public int CustomerId { get; set; }
        public string CustomerName { get; set; }
        public int DriverId { get; set; }
        public string DriverName { get; set; }
        public int Rating { get; set; }
        public string Comment { get; set; }
        public DateTime CreatedAt { get; set; }
    }
    
    public class CreateReviewDTO
    {
        [Required]
        public int DeliveryId { get; set; }
        
        [Required]
        public int DriverId { get; set; }
        
        [Required]
        [Range(1, 5)]
        public int Rating { get; set; }
        
        public string Comment { get; set; }
    }
    
    // Notification DTOs
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
    
    // Payment DTOs
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
    
    public class ProcessPaymentDTO
    {
        [Required]
        public int DeliveryId { get; set; }
        
        [Required]
        public string PaymentMethod { get; set; }
        
        [Required]
        public decimal Amount { get; set; }
        
        // Payment method specific fields
        public string CardNumber { get; set; }
        public string ExpiryDate { get; set; }
        public string Cvv { get; set; }
        public string BillingAddress { get; set; }
    }
}