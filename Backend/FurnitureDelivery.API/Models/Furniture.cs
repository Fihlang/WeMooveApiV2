using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace FurnitureDelivery.API.Models
{
    public class Furniture
    {
        [Key]
        public int Id { get; set; }
        
        [Required]
        public string Name { get; set; }
        
        public string Description { get; set; }
        
        [Required]
        public double Weight { get; set; } // in kilograms
        
        [Required]
        public string DimensionsJson { get; set; } // Stored as JSON: {"length": 100, "width": 50, "height": 75}
        
        [Required]
        public string Category { get; set; } // e.g., "Sofa", "Table", "Chair", "Bed"
        
        public string ImageUrl { get; set; }
        
        // Navigation properties
        public virtual ICollection<DeliveryItem> DeliveryItems { get; set; }
        
        // Helper methods for dimensions
        [JsonIgnore]
        public Dimensions Dimensions
        {
            get
            {
                if (string.IsNullOrEmpty(DimensionsJson))
                {
                    return new Dimensions();
                }
                
                try
                {
                    return JsonSerializer.Deserialize<Dimensions>(DimensionsJson);
                }
                catch
                {
                    return new Dimensions();
                }
            }
            set
            {
                DimensionsJson = JsonSerializer.Serialize(value);
            }
        }
    }
    
    public class Dimensions
    {
        public double Length { get; set; } // in centimeters
        public double Width { get; set; } // in centimeters
        public double Height { get; set; } // in centimeters
        
        // Calculate volume in cubic meters
        [JsonIgnore]
        public double Volume => (Length * Width * Height) / 1000000; // Convert from cubic cm to cubic m
    }
}