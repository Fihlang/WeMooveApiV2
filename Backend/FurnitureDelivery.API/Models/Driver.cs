using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace FurnitureDelivery.API.Models
{
    public class Driver
    {
        [Key]
        public int Id { get; set; }
        
        [Required]
        public int UserId { get; set; }
        
        [Required]
        public string VehicleType { get; set; }
        
        [Required]
        public string LicensePlate { get; set; }
        
        [Required]
        public string Capacity { get; set; } // e.g., "Small", "Medium", "Large"
        
        public bool IsAvailable { get; set; } = true;
        
        public double? CurrentLatitude { get; set; }
        
        public double? CurrentLongitude { get; set; }
        
        public double? Rating { get; set; }
        
        [Required]
        public string VerificationStatus { get; set; } = "pending"; // "pending", "verified", "rejected"
        
        // Stored as JSON
        public string Documents { get; set; } // License, insurance, etc.
        
        // Navigation properties
        [ForeignKey("UserId")]
        public virtual User User { get; set; }
        
        public virtual ICollection<Delivery> Deliveries { get; set; }
        
        public virtual ICollection<Review> Reviews { get; set; }
        
        // Method to calculate distance between driver and coordinate
        [NotMapped]
        [JsonIgnore]
        public double CalculateDistance(double latitude, double longitude)
        {
            if (!CurrentLatitude.HasValue || !CurrentLongitude.HasValue)
            {
                return double.MaxValue; // Driver without location is considered very far away
            }
            
            // Simple Euclidean distance for now - in a real app we'd use Haversine formula
            double latDiff = CurrentLatitude.Value - latitude;
            double lngDiff = CurrentLongitude.Value - longitude;
            return Math.Sqrt(latDiff * latDiff + lngDiff * lngDiff);
        }
    }
}