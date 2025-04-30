using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FurnitureDelivery.API.Models
{
    public class Delivery
    {
        [Key]
        public int Id { get; set; }
        
        [Required]
        public int CustomerId { get; set; }
        
        public int? DriverId { get; set; }
        
        [Required]
        public string Status { get; set; } = "pending"; // "pending", "accepted", "picked_up", "in_transit", "delivered", "completed", "cancelled"
        
        [Required]
        public string PickupAddress { get; set; }
        
        public double? PickupLatitude { get; set; }
        
        public double? PickupLongitude { get; set; }
        
        [Required]
        public string DestinationAddress { get; set; }
        
        public double? DestinationLatitude { get; set; }
        
        public double? DestinationLongitude { get; set; }
        
        [Required]
        public DateTime ScheduledDate { get; set; }
        
        public DateTime? CompletedDate { get; set; }
        
        [Required]
        public decimal TotalPrice { get; set; }
        
        public double? Distance { get; set; } // in kilometers
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        
        // Navigation properties
        [ForeignKey("CustomerId")]
        public virtual User Customer { get; set; }
        
        [ForeignKey("DriverId")]
        public virtual Driver Driver { get; set; }
        
        public virtual ICollection<DeliveryItem> Items { get; set; }
        
        public virtual ICollection<Message> Messages { get; set; }
        
        public virtual Payment Payment { get; set; }
        
        public virtual ICollection<Review> Reviews { get; set; }
        
        public virtual ICollection<Notification> Notifications { get; set; }
    }
}