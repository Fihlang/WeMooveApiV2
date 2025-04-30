using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace FurnitureDelivery.API.DTOs
{
    // Request DTOs
    public class LoginRequestDTO
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; }
        
        [Required]
        public string Password { get; set; }
    }
    
    public class RegisterRequestDTO
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; }
        
        [Required]
        [MinLength(8)]
        public string Password { get; set; }
        
        [Required]
        public string FirstName { get; set; }
        
        [Required]
        public string LastName { get; set; }
        
        [Required]
        public string PhoneNumber { get; set; }
        
        public string Address { get; set; }
        
        [Required]
        public string UserType { get; set; } // "customer" or "driver"
    }
    
    public class DriverRegistrationDTO : RegisterRequestDTO
    {
        [Required]
        public string VehicleType { get; set; }
        
        [Required]
        public string LicensePlate { get; set; }
        
        [Required]
        public string Capacity { get; set; }
        
        public string Documents { get; set; } // JSON string containing document URLs
    }
    
    public class ChangePasswordDTO
    {
        [Required]
        public string CurrentPassword { get; set; }
        
        [Required]
        [MinLength(8)]
        public string NewPassword { get; set; }
        
        [Required]
        [Compare("NewPassword")]
        public string ConfirmPassword { get; set; }
    }
    
    public class UpdateProfileDTO
    {
        public string FirstName { get; set; }
        
        public string LastName { get; set; }
        
        public string PhoneNumber { get; set; }
        
        public string Address { get; set; }
    }
    
    // Response DTOs
    public class LoginResponseDTO
    {
        public string Token { get; set; }
        public UserDTO User { get; set; }
    }
    
    public class UserDTO
    {
        public int Id { get; set; }
        public string Email { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string PhoneNumber { get; set; }
        public string Address { get; set; }
        public string AvatarUrl { get; set; }
        public bool IsVerified { get; set; }
        public string UserType { get; set; }
    }
}