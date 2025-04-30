using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace FurnitureDelivery.API.DTOs
{
    // Delivery Request DTOs
    public class CreateDeliveryDTO
    {
        [Required]
        public string PickupAddress { get; set; }
        
        [Required]
        [Range(-90, 90)]
        public double PickupLatitude { get; set; }
        
        [Required]
        [Range(-180, 180)]
        public double PickupLongitude { get; set; }
        
        [Required]
        public string DestinationAddress { get; set; }
        
        [Required]
        [Range(-90, 90)]
        public double DestinationLatitude { get; set; }
        
        [Required]
        [Range(-180, 180)]
        public double DestinationLongitude { get; set; }
        
        [Required]
        public DateTime ScheduledDate { get; set; }
        
        [Required]
        public string PaymentMethod { get; set; }
        
        [Required]
        public List<CreateDeliveryItemDTO> Items { get; set; }
    }
    
    public class CreateDeliveryItemDTO
    {
        [Required]
        public int FurnitureId { get; set; }
        
        [Required]
        [Range(1, int.MaxValue)]
        public int Quantity { get; set; }
        
        public bool SpecialHandling { get; set; }
    }
    
    public class UpdateDeliveryStatusDTO
    {
        [Required]
        public string Status { get; set; }
        
        public string Comment { get; set; }
    }
    
    public class AssignDriverDTO
    {
        [Required]
        public int DriverId { get; set; }
    }
    
    // Delivery Response DTOs
    public class DeliverySummaryDTO
    {
        public int Id { get; set; }
        public string Status { get; set; }
        public string PickupAddress { get; set; }
        public string DestinationAddress { get; set; }
        public DateTime ScheduledDate { get; set; }
        public decimal TotalPrice { get; set; }
        public int ItemCount { get; set; }
        public string DriverName { get; set; }
        public DateTime CreatedAt { get; set; }
    }
    
    public class DeliveryDetailDTO
    {
        public int Id { get; set; }
        public int CustomerId { get; set; }
        public UserDTO Customer { get; set; }
        public int? DriverId { get; set; }
        public DriverDTO Driver { get; set; }
        public string Status { get; set; }
        public string PickupAddress { get; set; }
        public double PickupLatitude { get; set; }
        public double PickupLongitude { get; set; }
        public string DestinationAddress { get; set; }
        public double DestinationLatitude { get; set; }
        public double DestinationLongitude { get; set; }
        public DateTime ScheduledDate { get; set; }
        public DateTime? CompletedDate { get; set; }
        public decimal TotalPrice { get; set; }
        public double? Distance { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public List<DeliveryItemDetailDTO> Items { get; set; }
        public PaymentDTO Payment { get; set; }
    }
    
    public class DeliveryItemDetailDTO
    {
        public int Id { get; set; }
        public int DeliveryId { get; set; }
        public int FurnitureId { get; set; }
        public FurnitureDTO Furniture { get; set; }
        public int Quantity { get; set; }
        public bool SpecialHandling { get; set; }
    }
}