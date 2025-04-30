using System.ComponentModel.DataAnnotations;

namespace FurnitureDelivery.API.DTOs
{
    public class LoginRequest
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; }

        [Required]
        public string Password { get; set; }
    }

    public class RegisterRequest
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; }

        [Required]
        [MinLength(6)]
        public string Password { get; set; }

        [Required]
        public string FirstName { get; set; }

        [Required]
        public string LastName { get; set; }

        [Required]
        public string PhoneNumber { get; set; }

        public string? Address { get; set; }

        [Required]
        [RegularExpression("customer|driver", ErrorMessage = "UserType must be either 'customer' or 'driver'")]
        public string UserType { get; set; }

        // Driver-specific fields (required only if UserType is 'driver')
        public string? VehicleType { get; set; }
        public string? LicensePlate { get; set; }
        public string? Capacity { get; set; }
    }

    public class LoginResponse
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
        public string? Address { get; set; }
        public string? AvatarUrl { get; set; }
        public bool IsVerified { get; set; }
        public string UserType { get; set; }
        public DriverDTO? Driver { get; set; }
    }

    public class DriverDTO
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string VehicleType { get; set; }
        public string LicensePlate { get; set; }
        public string Capacity { get; set; }
        public double? Rating { get; set; }
        public bool IsAvailable { get; set; }
        public double? CurrentLatitude { get; set; }
        public double? CurrentLongitude { get; set; }
        public string VerificationStatus { get; set; }
    }
}