using System.Security.Claims;
using FurnitureDelivery.API.Data;
using FurnitureDelivery.API.DTOs;
using FurnitureDelivery.API.Models;
using FurnitureDelivery.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FurnitureDelivery.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly ApplicationDbContext _dbContext;
        private readonly IAuthService _authService;
        private readonly INotificationService _notificationService;

        public AuthController(
            ApplicationDbContext dbContext,
            IAuthService authService,
            INotificationService notificationService)
        {
            _dbContext = dbContext;
            _authService = authService;
            _notificationService = notificationService;
        }

        [HttpPost("register/customer")]
        public async Task<ActionResult<ApiResponse<AuthResponse>>> RegisterCustomer([FromBody] RegisterRequest request)
        {
            // Validate request
            if (string.IsNullOrEmpty(request.Email) || string.IsNullOrEmpty(request.Password))
            {
                return BadRequest(ApiResponse<AuthResponse>.ErrorResponse("Email and password are required"));
            }

            // Check if email already exists
            var existingUser = await _dbContext.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
            if (existingUser != null)
            {
                return BadRequest(ApiResponse<AuthResponse>.ErrorResponse("Email already registered"));
            }

            // Create password hash
            var (passwordHash, passwordSalt) = _authService.HashPassword(request.Password);

            // Create new user
            var user = new User
            {
                Email = request.Email,
                FirstName = request.FirstName,
                LastName = request.LastName,
                PhoneNumber = request.PhoneNumber,
                Address = request.Address,
                AvatarUrl = null,
                PasswordHash = passwordHash,
                PasswordSalt = passwordSalt,
                UserType = "customer",
                IsVerified = false,
                CreatedAt = DateTime.UtcNow
            };

            _dbContext.Users.Add(user);
            await _dbContext.SaveChangesAsync();

            // Create welcome notification
            await _notificationService.CreateNotification(
                user.Id,
                "info",
                "Welcome to Furniture Delivery",
                "Thank you for registering! You can now start scheduling furniture deliveries.",
                "user",
                user.Id);

            // Generate JWT token
            var token = _authService.GenerateJwtToken(user);

            // Return response
            var response = new AuthResponse
            {
                Token = token,
                User = new UserDTO
                {
                    Id = user.Id,
                    Email = user.Email,
                    FirstName = user.FirstName,
                    LastName = user.LastName,
                    PhoneNumber = user.PhoneNumber,
                    Address = user.Address,
                    AvatarUrl = user.AvatarUrl,
                    IsVerified = user.IsVerified,
                    UserType = user.UserType
                }
            };

            return Ok(ApiResponse<AuthResponse>.SuccessResponse(response, "Registration successful"));
        }

        [HttpPost("register/driver")]
        public async Task<ActionResult<ApiResponse<AuthResponse>>> RegisterDriver([FromBody] RegisterDriverRequest request)
        {
            // Validate request
            if (string.IsNullOrEmpty(request.Email) || string.IsNullOrEmpty(request.Password))
            {
                return BadRequest(ApiResponse<AuthResponse>.ErrorResponse("Email and password are required"));
            }

            // Check if email already exists
            var existingUser = await _dbContext.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
            if (existingUser != null)
            {
                return BadRequest(ApiResponse<AuthResponse>.ErrorResponse("Email already registered"));
            }

            // Create password hash
            var (passwordHash, passwordSalt) = _authService.HashPassword(request.Password);

            // Create new user
            var user = new User
            {
                Email = request.Email,
                FirstName = request.FirstName,
                LastName = request.LastName,
                PhoneNumber = request.PhoneNumber,
                Address = request.Address,
                AvatarUrl = null,
                PasswordHash = passwordHash,
                PasswordSalt = passwordSalt,
                UserType = "driver",
                IsVerified = false,
                CreatedAt = DateTime.UtcNow
            };

            _dbContext.Users.Add(user);
            await _dbContext.SaveChangesAsync();

            // Create driver record
            var driver = new Driver
            {
                UserId = user.Id,
                VehicleType = request.VehicleType,
                LicensePlate = request.LicensePlate,
                Capacity = request.Capacity,
                Rating = null,
                IsAvailable = false,
                CurrentLatitude = null,
                CurrentLongitude = null,
                VerificationStatus = "pending",
                Documents = request.Documents
            };

            _dbContext.Drivers.Add(driver);
            await _dbContext.SaveChangesAsync();

            // Create welcome notification
            await _notificationService.CreateNotification(
                user.Id,
                "info",
                "Welcome to Furniture Delivery",
                "Thank you for registering as a driver! Your account is pending verification.",
                "user",
                user.Id);

            // Generate JWT token
            var token = _authService.GenerateJwtToken(user);

            // Return response
            var response = new AuthResponse
            {
                Token = token,
                User = new UserDTO
                {
                    Id = user.Id,
                    Email = user.Email,
                    FirstName = user.FirstName,
                    LastName = user.LastName,
                    PhoneNumber = user.PhoneNumber,
                    Address = user.Address,
                    AvatarUrl = user.AvatarUrl,
                    IsVerified = user.IsVerified,
                    UserType = user.UserType
                },
                Driver = new DriverDTO
                {
                    Id = driver.Id,
                    UserId = driver.UserId,
                    VehicleType = driver.VehicleType,
                    LicensePlate = driver.LicensePlate,
                    Capacity = driver.Capacity,
                    Rating = driver.Rating,
                    IsAvailable = driver.IsAvailable,
                    CurrentLatitude = driver.CurrentLatitude,
                    CurrentLongitude = driver.CurrentLongitude,
                    VerificationStatus = driver.VerificationStatus
                }
            };

            return Ok(ApiResponse<AuthResponse>.SuccessResponse(response, "Registration successful. Your driver account is pending verification."));
        }

        [HttpPost("login")]
        public async Task<ActionResult<ApiResponse<AuthResponse>>> Login([FromBody] LoginRequest request)
        {
            // Validate request
            if (string.IsNullOrEmpty(request.Email) || string.IsNullOrEmpty(request.Password))
            {
                return BadRequest(ApiResponse<AuthResponse>.ErrorResponse("Email and password are required"));
            }

            // Find user by email
            var user = await _dbContext.Users
                .Include(u => u.Driver)
                .FirstOrDefaultAsync(u => u.Email == request.Email);

            if (user == null)
            {
                return BadRequest(ApiResponse<AuthResponse>.ErrorResponse("Invalid email or password"));
            }

            // Verify password
            if (!_authService.VerifyPassword(request.Password, user.PasswordHash, user.PasswordSalt))
            {
                return BadRequest(ApiResponse<AuthResponse>.ErrorResponse("Invalid email or password"));
            }

            // Generate JWT token
            var token = _authService.GenerateJwtToken(user);

            // Create response
            var response = new AuthResponse
            {
                Token = token,
                User = new UserDTO
                {
                    Id = user.Id,
                    Email = user.Email,
                    FirstName = user.FirstName,
                    LastName = user.LastName,
                    PhoneNumber = user.PhoneNumber,
                    Address = user.Address,
                    AvatarUrl = user.AvatarUrl,
                    IsVerified = user.IsVerified,
                    UserType = user.UserType
                }
            };

            // If driver, include driver details
            if (user.UserType == "driver" && user.Driver != null)
            {
                response.Driver = new DriverDTO
                {
                    Id = user.Driver.Id,
                    UserId = user.Driver.UserId,
                    VehicleType = user.Driver.VehicleType,
                    LicensePlate = user.Driver.LicensePlate,
                    Capacity = user.Driver.Capacity,
                    Rating = user.Driver.Rating,
                    IsAvailable = user.Driver.IsAvailable,
                    CurrentLatitude = user.Driver.CurrentLatitude,
                    CurrentLongitude = user.Driver.CurrentLongitude,
                    VerificationStatus = user.Driver.VerificationStatus
                };
            }

            return Ok(ApiResponse<AuthResponse>.SuccessResponse(response, "Login successful"));
        }

        [HttpPost("validate")]
        public ActionResult<ApiResponse<bool>> ValidateToken([FromBody] ValidateTokenRequest request)
        {
            var isValid = _authService.ValidateToken(request.Token);
            return Ok(ApiResponse<bool>.SuccessResponse(isValid));
        }

        [HttpGet("profile")]
        [Authorize]
        public async Task<ActionResult<ApiResponse<UserDTO>>> GetProfile()
        {
            // Get user ID from token claims
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out var userId))
            {
                return BadRequest(ApiResponse<UserDTO>.ErrorResponse("Invalid user ID in token"));
            }

            // Get user
            var user = await _dbContext.Users
                .Include(u => u.Driver)
                .FirstOrDefaultAsync(u => u.Id == userId);

            if (user == null)
            {
                return NotFound(ApiResponse<UserDTO>.ErrorResponse("User not found"));
            }

            // Map to DTO
            var userDTO = new UserDTO
            {
                Id = user.Id,
                Email = user.Email,
                FirstName = user.FirstName,
                LastName = user.LastName,
                PhoneNumber = user.PhoneNumber,
                Address = user.Address,
                AvatarUrl = user.AvatarUrl,
                IsVerified = user.IsVerified,
                UserType = user.UserType
            };

            return Ok(ApiResponse<UserDTO>.SuccessResponse(userDTO));
        }

        [HttpPut("profile")]
        [Authorize]
        public async Task<ActionResult<ApiResponse<UserDTO>>> UpdateProfile([FromBody] UpdateProfileRequest request)
        {
            // Get user ID from token claims
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out var userId))
            {
                return BadRequest(ApiResponse<UserDTO>.ErrorResponse("Invalid user ID in token"));
            }

            // Get user
            var user = await _dbContext.Users.FindAsync(userId);
            if (user == null)
            {
                return NotFound(ApiResponse<UserDTO>.ErrorResponse("User not found"));
            }

            // Update user properties
            if (!string.IsNullOrEmpty(request.FirstName))
                user.FirstName = request.FirstName;

            if (!string.IsNullOrEmpty(request.LastName))
                user.LastName = request.LastName;

            if (!string.IsNullOrEmpty(request.PhoneNumber))
                user.PhoneNumber = request.PhoneNumber;

            if (request.Address != null)
                user.Address = request.Address;

            if (request.AvatarUrl != null)
                user.AvatarUrl = request.AvatarUrl;

            await _dbContext.SaveChangesAsync();

            // Map to DTO
            var userDTO = new UserDTO
            {
                Id = user.Id,
                Email = user.Email,
                FirstName = user.FirstName,
                LastName = user.LastName,
                PhoneNumber = user.PhoneNumber,
                Address = user.Address,
                AvatarUrl = user.AvatarUrl,
                IsVerified = user.IsVerified,
                UserType = user.UserType
            };

            return Ok(ApiResponse<UserDTO>.SuccessResponse(userDTO, "Profile updated successfully"));
        }

        [HttpPut("change-password")]
        [Authorize]
        public async Task<ActionResult<ApiResponse<bool>>> ChangePassword([FromBody] ChangePasswordRequest request)
        {
            // Get user ID from token claims
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out var userId))
            {
                return BadRequest(ApiResponse<bool>.ErrorResponse("Invalid user ID in token"));
            }

            // Get user
            var user = await _dbContext.Users.FindAsync(userId);
            if (user == null)
            {
                return NotFound(ApiResponse<bool>.ErrorResponse("User not found"));
            }

            // Verify current password
            if (!_authService.VerifyPassword(request.CurrentPassword, user.PasswordHash, user.PasswordSalt))
            {
                return BadRequest(ApiResponse<bool>.ErrorResponse("Current password is incorrect"));
            }

            // Create new password hash
            var (passwordHash, passwordSalt) = _authService.HashPassword(request.NewPassword);
            user.PasswordHash = passwordHash;
            user.PasswordSalt = passwordSalt;

            await _dbContext.SaveChangesAsync();

            // Create notification
            await _notificationService.CreateNotification(
                userId,
                "success",
                "Password Changed",
                "Your password has been changed successfully.",
                "user",
                userId);

            return Ok(ApiResponse<bool>.SuccessResponse(true, "Password changed successfully"));
        }
    }
}