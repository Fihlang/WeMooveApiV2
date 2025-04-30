using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FurnitureDelivery.API.Models
{
    public class Notification
    {
        [Key]
        public int Id { get; set; }
        
        [Required]
        public int UserId { get; set; }
        
        [Required]
        public string Type { get; set; } // "delivery_update", "message", "payment", "review", etc.
        
        [Required]
        public string Title { get; set; }
        
        [Required]
        public string Message { get; set; }
        
        public bool IsRead { get; set; } = false;
        
        public string RelatedEntityType { get; set; } // "delivery", "message", "payment", etc.
        
        public int? RelatedEntityId { get; set; }
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        // Navigation properties
        [ForeignKey("UserId")]
        public virtual User User { get; set; }
        
        // Optional relationship to delivery
        [ForeignKey("RelatedEntityId")]
        public virtual Delivery Delivery { get; set; }
    }
}