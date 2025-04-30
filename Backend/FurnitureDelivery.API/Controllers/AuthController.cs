using FurnitureDelivery.API.Data;
using FurnitureDelivery.API.DTOs;
using FurnitureDelivery.API.Models;
using FurnitureDelivery.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Threading.Tasks;

namespace FurnitureDelivery.API.Controllers
{
    [Route("api/auth")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IAuthService _authService;

        public AuthController(ApplicationDbContext context, IAuthService authService)
        {
            _context = context;
            _authService = authService;
        }

        [HttpPost("login")]
        public async Task<ActionResult<LoginResponseDTO>> Login(LoginRequestDTO loginRequest)
        {
            // Find user by email
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Email == loginRequest.Email);

            if (user == null)
            {
                return Unauthorized(new { message = "Invalid email or password" });
            }

            // Verify password
            bool isPasswordValid = _authService.VerifyPassword(loginRequest.Password, user.PasswordHash, user.Salt);
            if (!isPasswordValid)
            {
                return Unauthorized(new { message = "Invalid email or password" });
            }

            // Generate token
            string token = _authService.GenerateJwtToken(user);

            // Create response
            var response = new LoginResponseDTO
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

            return Ok(response);
        }

        [HttpPost("register")]
        public async Task<ActionResult<LoginResponseDTO>> Register(RegisterRequestDTO registerRequest)
        {
            // Check if email already exists
            if (await _context.Users.AnyAsync(u => u.Email == registerRequest.Email))
            {
                return BadRequest(new { message = "Email already in use" });
            }

            // Hash password
            var (hash, salt) = _authService.HashPassword(registerRequest.Password);

            // Create new user
            var user = new User
            {
                Email = registerRequest.Email,
                PasswordHash = hash,
                Salt = salt,
                FirstName = registerRequest.FirstName,
                LastName = registerRequest.LastName,
                PhoneNumber = registerRequest.PhoneNumber,
                Address = registerRequest.Address,
                CreatedAt = DateTime.UtcNow,
                IsVerified = false, // User needs to verify their email
                UserType = registerRequest.UserType
            };

            // Save user to database
            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            // If registering as a driver, create driver record
            if (registerRequest is DriverRegistrationDTO driverRequest && registerRequest.UserType == "driver")
            {
                var driver = new Driver
                {
                    UserId = user.Id,
                    VehicleType = driverRequest.VehicleType,
                    LicensePlate = driverRequest.LicensePlate,
                    Capacity = driverRequest.Capacity,
                    IsAvailable = true,
                    VerificationStatus = "pending", // Driver needs to be verified by admin
                    Documents = driverRequest.Documents,
                };

                _context.Drivers.Add(driver);
                await _context.SaveChangesAsync();
            }

            // Generate token
            string token = _authService.GenerateJwtToken(user);

            // Create response
            var response = new LoginResponseDTO
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

            return Ok(response);
        }

        [Authorize]
        [HttpPost("change-password")]
        public async Task<IActionResult> ChangePassword(ChangePasswordDTO changePasswordDto)
        {
            // Get user ID from claims
            int userId = int.Parse(User.FindFirst("uid")?.Value);

            // Find user in database
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
            {
                return NotFound(new { message = "User not found" });
            }

            // Verify current password
            bool isPasswordValid = _authService.VerifyPassword(changePasswordDto.CurrentPassword, user.PasswordHash, user.Salt);
            if (!isPasswordValid)
            {
                return BadRequest(new { message = "Current password is incorrect" });
            }

            // Hash new password
            var (hash, salt) = _authService.HashPassword(changePasswordDto.NewPassword);

            // Update user password
            user.PasswordHash = hash;
            user.Salt = salt;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Password changed successfully" });
        }

        [Authorize]
        [HttpGet("me")]
        public async Task<ActionResult<UserDTO>> GetCurrentUser()
        {
            // Get user ID from claims
            int userId = int.Parse(User.FindFirst("uid")?.Value);

            // Find user in database
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
            {
                return NotFound(new { message = "User not found" });
            }

            // Map user to DTO
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

            return Ok(userDto);
        }

        [Authorize]
        [HttpPut("profile")]
        public async Task<ActionResult<UserDTO>> UpdateProfile(UpdateProfileDTO updateProfileDto)
        {
            // Get user ID from claims
            int userId = int.Parse(User.FindFirst("uid")?.Value);

            // Find user in database
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
            {
                return NotFound(new { message = "User not found" });
            }

            // Update user details
            if (!string.IsNullOrEmpty(updateProfileDto.FirstName))
                user.FirstName = updateProfileDto.FirstName;

            if (!string.IsNullOrEmpty(updateProfileDto.LastName))
                user.LastName = updateProfileDto.LastName;

            if (!string.IsNullOrEmpty(updateProfileDto.PhoneNumber))
                user.PhoneNumber = updateProfileDto.PhoneNumber;

            user.Address = updateProfileDto.Address; // Can be null

            await _context.SaveChangesAsync();

            // Map updated user to DTO
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

            return Ok(userDto);
        }
    }
}