using System;
using System.ComponentModel.DataAnnotations;

namespace FurnitureDelivery.API.DTOs
{
    public class RegisterDTO
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; }
        
        [Required]
        [MinLength(8)]
        public string Password { get; set; }
        
        [Required]
        [Compare("Password", ErrorMessage = "Passwords do not match")]
        public string ConfirmPassword { get; set; }
        
        [Required]
        public string FirstName { get; set; }
        
        [Required]
        public string LastName { get; set; }
        
        [Required]
        [Phone]
        public string PhoneNumber { get; set; }
        
        public string Address { get; set; }
        
        [Required]
        [RegularExpression("customer|driver", ErrorMessage = "User type must be either 'customer' or 'driver'")]
        public string UserType { get; set; }
    }
    
    public class DriverRegistrationDTO
    {
        [Required]
        public string VehicleType { get; set; }
        
        [Required]
        public string LicensePlate { get; set; }
        
        [Required]
        public string Capacity { get; set; }
        
        public string Documents { get; set; }
    }
    
    public class LoginDTO
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; }
        
        [Required]
        public string Password { get; set; }
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
        public DateTime CreatedAt { get; set; }
        public DriverDTO Driver { get; set; }
    }
    
    public class AuthResponseDTO
    {
        public bool Success { get; set; }
        public string Message { get; set; }
        public string Token { get; set; }
        public UserDTO User { get; set; }
    }
    
    public class ChangePasswordDTO
    {
        [Required]
        public string CurrentPassword { get; set; }
        
        [Required]
        [MinLength(8)]
        public string NewPassword { get; set; }
        
        [Required]
        [Compare("NewPassword", ErrorMessage = "Passwords do not match")]
        public string ConfirmNewPassword { get; set; }
    }
    
    public class UpdateProfileDTO
    {
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string PhoneNumber { get; set; }
        public string Address { get; set; }
        public string AvatarUrl { get; set; }
    }
}