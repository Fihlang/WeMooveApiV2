using System.Text.Json.Serialization;

namespace FurnitureDelivery.API.DTOs
{
    // Generic API Response
    public class ApiResponse<T>
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public T? Data { get; set; }

        public static ApiResponse<T> SuccessResponse(T data, string message = "Request successful")
        {
            return new ApiResponse<T>
            {
                Success = true,
                Message = message,
                Data = data
            };
        }

        public static ApiResponse<T> ErrorResponse(string message)
        {
            return new ApiResponse<T>
            {
                Success = false,
                Message = message,
                Data = default
            };
        }
    }

    // User DTO
    public class UserDTO
    {
        public int Id { get; set; }
        public string Email { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public string? Address { get; set; }
        public string? AvatarUrl { get; set; }
        public bool IsVerified { get; set; }
        public string UserType { get; set; } = string.Empty;
    }

    // Driver DTO
    public class DriverDTO
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string VehicleType { get; set; } = string.Empty;
        public string LicensePlate { get; set; } = string.Empty;
        public string Capacity { get; set; } = string.Empty;
        public double? Rating { get; set; }
        public bool IsAvailable { get; set; }
        public double? CurrentLatitude { get; set; }
        public double? CurrentLongitude { get; set; }
        public string VerificationStatus { get; set; } = string.Empty;
    }

    // Auth Response
    public class AuthResponse
    {
        public string Token { get; set; } = string.Empty;
        public UserDTO User { get; set; } = null!;
        public DriverDTO? Driver { get; set; }
    }

    // Login Request
    public class LoginRequest
    {
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }

    // Register Request
    public class RegisterRequest
    {
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public string? Address { get; set; }
    }

    // Register Driver Request
    public class RegisterDriverRequest : RegisterRequest
    {
        public string VehicleType { get; set; } = string.Empty;
        public string LicensePlate { get; set; } = string.Empty;
        public string Capacity { get; set; } = string.Empty;
        public object? Documents { get; set; }
    }

    // Validate Token Request
    public class ValidateTokenRequest
    {
        public string Token { get; set; } = string.Empty;
    }

    // Update Profile Request
    public class UpdateProfileRequest
    {
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string? PhoneNumber { get; set; }
        public string? Address { get; set; }
        public string? AvatarUrl { get; set; }
    }

    // Change Password Request
    public class ChangePasswordRequest
    {
        public string CurrentPassword { get; set; } = string.Empty;
        public string NewPassword { get; set; } = string.Empty;
    }

    // Driver Nearby Request
    public class DriverNearbyRequest
    {
        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public double Radius { get; set; } = 10; // Default 10 km
    }

    // Update Driver Location Request
    public class UpdateDriverLocationRequest
    {
        public double Latitude { get; set; }
        public double Longitude { get; set; }
    }
}