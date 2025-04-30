using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FurnitureDelivery.API.Models
{
    public class Payment
    {
        [Key]
        public int Id { get; set; }
        
        [Required]
        public int DeliveryId { get; set; }
        
        [Required]
        public decimal Amount { get; set; }
        
        [Required]
        public string Status { get; set; } = "pending"; // "pending", "completed", "failed", "refunded"
        
        [Required]
        public string PaymentMethod { get; set; } = "credit_card"; // "credit_card", "paypal", "cash"
        
        public string TransactionId { get; set; } // External payment provider transaction ID
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        public DateTime? CompletedAt { get; set; }
        
        // Additional payment details stored as JSON
        public string PaymentDetailsJson { get; set; }
        
        // Navigation properties
        [ForeignKey("DeliveryId")]
        public virtual Delivery Delivery { get; set; }
    }
}