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

        [HttpPost("login")]
        public async Task<ActionResult<ApiResponse<LoginResponse>>> Login(LoginRequest request)
        {
            // Find user by email
            var user = await _dbContext.Users
                .Include(u => u.Driver)
                .FirstOrDefaultAsync(u => u.Email == request.Email);

            if (user == null)
            {
                return BadRequest(ApiResponse<LoginResponse>.ErrorResponse("Invalid email or password"));
            }

            // Validate password
            if (!_authService.VerifyPassword(request.Password, user.PasswordHash, user.PasswordSalt))
            {
                return BadRequest(ApiResponse<LoginResponse>.ErrorResponse("Invalid email or password"));
            }

            // Generate JWT token
            var token = _authService.GenerateJwtToken(user);

            // Create response
            var response = new LoginResponse
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

            // Add driver details if applicable
            if (user.UserType == "driver" && user.Driver != null)
            {
                response.User.Driver = new DriverDTO
                {
                    Id = user.Driver.Id,
                    UserId = user.Id,
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

            // Return successful response
            return Ok(ApiResponse<LoginResponse>.SuccessResponse(response, "Login successful"));
        }

        [HttpPost("register")]
        public async Task<ActionResult<ApiResponse<UserDTO>>> Register(RegisterRequest request)
        {
            // Check if email already exists
            if (await _dbContext.Users.AnyAsync(u => u.Email == request.Email))
            {
                return BadRequest(ApiResponse<UserDTO>.ErrorResponse("Email already in use"));
            }

            // Create user entity
            var (passwordHash, passwordSalt) = _authService.HashPassword(request.Password);
            
            var user = new User
            {
                Email = request.Email,
                PasswordHash = passwordHash,
                PasswordSalt = passwordSalt,
                FirstName = request.FirstName,
                LastName = request.LastName,
                PhoneNumber = request.PhoneNumber,
                Address = request.Address,
                UserType = request.UserType,
                IsVerified = false,
                CreatedAt = DateTime.UtcNow
            };

            // Add user to database
            _dbContext.Users.Add(user);
            await _dbContext.SaveChangesAsync();

            // If user type is driver, create driver record
            if (request.UserType == "driver")
            {
                if (string.IsNullOrEmpty(request.VehicleType) ||
                    string.IsNullOrEmpty(request.LicensePlate) ||
                    string.IsNullOrEmpty(request.Capacity))
                {
                    return BadRequest(ApiResponse<UserDTO>.ErrorResponse(
                        "Vehicle type, license plate, and capacity are required for driver registration"));
                }

                var driver = new Driver
                {
                    UserId = user.Id,
                    VehicleType = request.VehicleType,
                    LicensePlate = request.LicensePlate,
                    Capacity = request.Capacity,
                    IsAvailable = false,
                    VerificationStatus = "pending"
                };

                _dbContext.Drivers.Add(driver);
                await _dbContext.SaveChangesAsync();

                // Send notification to admin about new driver registration
                await _notificationService.CreateNotification(
                    1, // Admin user ID
                    "info",
                    "New Driver Registration",
                    $"A new driver ({user.FirstName} {user.LastName}) has registered and requires verification.",
                    "driver",
                    driver.Id);
            }

            // Create welcome notification for the user
            await _notificationService.CreateNotification(
                user.Id,
                "success",
                "Welcome to Furniture Delivery!",
                $"Thank you for registering, {user.FirstName}! We're excited to have you on board.");

            // Create response
            var userDto = new UserDTO
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

            // Add driver details if applicable
            if (user.UserType == "driver")
            {
                var driver = await _dbContext.Drivers.FirstOrDefaultAsync(d => d.UserId == user.Id);
                if (driver != null)
                {
                    userDto.Driver = new DriverDTO
                    {
                        Id = driver.Id,
                        UserId = user.Id,
                        VehicleType = driver.VehicleType,
                        LicensePlate = driver.LicensePlate,
                        Capacity = driver.Capacity,
                        Rating = driver.Rating,
                        IsAvailable = driver.IsAvailable,
                        CurrentLatitude = driver.CurrentLatitude,
                        CurrentLongitude = driver.CurrentLongitude,
                        VerificationStatus = driver.VerificationStatus
                    };
                }
            }

            // Return successful response
            return CreatedAtAction(
                nameof(GetProfile),
                new { id = user.Id },
                ApiResponse<UserDTO>.SuccessResponse(userDto, "Registration successful")
            );
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

            // Find user by ID
            var user = await _dbContext.Users
                .Include(u => u.Driver)
                .FirstOrDefaultAsync(u => u.Id == userId);

            if (user == null)
            {
                return NotFound(ApiResponse<UserDTO>.ErrorResponse("User not found"));
            }

            // Create response
            var userDto = new UserDTO
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

            // Add driver details if applicable
            if (user.UserType == "driver" && user.Driver != null)
            {
                userDto.Driver = new DriverDTO
                {
                    Id = user.Driver.Id,
                    UserId = user.Id,
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

            // Return successful response
            return Ok(ApiResponse<UserDTO>.SuccessResponse(userDto));
        }
    }
}