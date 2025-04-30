using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FurnitureDelivery.API.Models
{
    public class User
    {
        [Key]
        public int Id { get; set; }
        
        [Required]
        [EmailAddress]
        public string Email { get; set; }
        
        [Required]
        public string PasswordHash { get; set; }
        
        public string Salt { get; set; }
        
        [Required]
        public string FirstName { get; set; }
        
        [Required]
        public string LastName { get; set; }
        
        [Required]
        [Phone]
        public string PhoneNumber { get; set; }
        
        public string Address { get; set; }
        
        public string AvatarUrl { get; set; }
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        public bool IsVerified { get; set; } = false;
        
        [Required]
        public string UserType { get; set; } // "customer" or "driver"
        
        // Navigation properties
        public virtual Driver Driver { get; set; }
        
        // Computed property (not mapped to DB)
        [NotMapped]
        public string FullName => $"{FirstName} {LastName}";
    }
}