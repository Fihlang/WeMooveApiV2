using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FurnitureDelivery.API.Models
{
    public class DeliveryItem
    {
        [Key]
        public int Id { get; set; }
        
        [Required]
        public int DeliveryId { get; set; }
        
        [Required]
        public int FurnitureId { get; set; }
        
        [Required]
        public int Quantity { get; set; } = 1;
        
        public bool SpecialHandling { get; set; } = false;
        
        // Navigation properties
        [ForeignKey("DeliveryId")]
        public virtual Delivery Delivery { get; set; }
        
        [ForeignKey("FurnitureId")]
        public virtual Furniture Furniture { get; set; }
    }
}