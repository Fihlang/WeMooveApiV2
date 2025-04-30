using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FurnitureDelivery.API.Models
{
    public class Message
    {
        [Key]
        public int Id { get; set; }
        
        [Required]
        public int DeliveryId { get; set; }
        
        [Required]
        public int SenderId { get; set; }
        
        [Required]
        public string SenderType { get; set; } // "customer", "driver", "admin", "system"
        
        [Required]
        public string Content { get; set; }
        
        [Required]
        public DateTime CreatedAt { get; set; }
        
        public bool IsRead { get; set; }
        
        // Navigation properties
        [ForeignKey("DeliveryId")]
        public virtual Delivery Delivery { get; set; }
    }
}