using FurnitureDelivery.API.Data;
using FurnitureDelivery.API.DTOs;
using FurnitureDelivery.API.Models;
using FurnitureDelivery.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace FurnitureDelivery.API.Controllers
{
    [Route("api/drivers")]
    [ApiController]
    public class DriversController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IWebSocketService _webSocketService;

        public DriversController(
            ApplicationDbContext context,
            IWebSocketService webSocketService)
        {
            _context = context;
            _webSocketService = webSocketService;
        }

        // GET: api/drivers
        [HttpGet]
        [Authorize(Roles = "admin")]
        public async Task<ActionResult<IEnumerable<DriverDTO>>> GetDrivers()
        {
            var drivers = await _context.Drivers
                .Include(d => d.User)
                .ToListAsync();

            var driverDtos = drivers.Select(MapDriverToDto).ToList();

            return Ok(driverDtos);
        }

        // GET: api/drivers/5
        [HttpGet("{id}")]
        [Authorize]
        public async Task<ActionResult<DriverDTO>> GetDriver(int id)
        {
            var driver = await _context.Drivers
                .Include(d => d.User)
                .FirstOrDefaultAsync(d => d.Id == id);

            if (driver == null)
            {
                return NotFound(new { message = "Driver not found" });
            }

            return Ok(MapDriverToDto(driver));
        }

        // GET: api/drivers/user/5
        [HttpGet("user/{userId}")]
        [Authorize]
        public async Task<ActionResult<DriverDTO>> GetDriverByUserId(int userId)
        {
            // Check if the requesting user has access
            int requestingUserId = int.Parse(User.FindFirst("uid")?.Value);
            string userType = User.FindFirst("user_type")?.Value;

            if (requestingUserId != userId && userType != "admin")
            {
                return Forbid();
            }

            var driver = await _context.Drivers
                .Include(d => d.User)
                .FirstOrDefaultAsync(d => d.UserId == userId);

            if (driver == null)
            {
                return NotFound(new { message = "Driver not found" });
            }

            return Ok(MapDriverToDto(driver));
        }

        // PATCH: api/drivers/5/location
        [HttpPatch("{id}/location")]
        [Authorize(Roles = "driver")]
        public async Task<IActionResult> UpdateLocation(int id, UpdateDriverLocationDTO updateDto)
        {
            // Get user ID from claims
            int userId = int.Parse(User.FindFirst("uid")?.Value);

            // Get driver
            var driver = await _context.Drivers
                .FirstOrDefaultAsync(d => d.Id == id);

            if (driver == null)
            {
                return NotFound(new { message = "Driver not found" });
            }

            // Check if the driver belongs to the requesting user
            if (driver.UserId != userId)
            {
                return Forbid();
            }

            // Update location
            driver.CurrentLatitude = updateDto.Latitude;
            driver.CurrentLongitude = updateDto.Longitude;

            await _context.SaveChangesAsync();

            // Get active deliveries for this driver
            var activeDeliveries = await _context.Deliveries
                .Where(d => d.DriverId == id && 
                           (d.Status == "accepted" || d.Status == "picked_up" || d.Status == "in_transit"))
                .ToListAsync();

            // Send WebSocket updates for each active delivery
            foreach (var delivery in activeDeliveries)
            {
                await _webSocketService.SendDriverLocationUpdate(
                    delivery.Id,
                    driver.Id,
                    updateDto.Latitude,
                    updateDto.Longitude);
            }

            return Ok(new { message = "Location updated successfully" });
        }

        // PATCH: api/drivers/5/availability
        [HttpPatch("{id}/availability")]
        [Authorize(Roles = "driver")]
        public async Task<IActionResult> UpdateAvailability(int id, [FromBody] bool isAvailable)
        {
            // Get user ID from claims
            int userId = int.Parse(User.FindFirst("uid")?.Value);

            // Get driver
            var driver = await _context.Drivers
                .FirstOrDefaultAsync(d => d.Id == id);

            if (driver == null)
            {
                return NotFound(new { message = "Driver not found" });
            }

            // Check if the driver belongs to the requesting user
            if (driver.UserId != userId)
            {
                return Forbid();
            }

            // Check if driver has active deliveries
            if (isAvailable == false)
            {
                var hasActiveDeliveries = await _context.Deliveries
                    .AnyAsync(d => d.DriverId == id && 
                               (d.Status == "accepted" || d.Status == "picked_up" || d.Status == "in_transit"));

                if (hasActiveDeliveries)
                {
                    return BadRequest(new { message = "Cannot mark as unavailable while having active deliveries" });
                }
            }

            // Update availability
            driver.IsAvailable = isAvailable;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Availability updated successfully" });
        }

        // GET: api/drivers/nearby
        [HttpGet("nearby")]
        [Authorize]
        public async Task<ActionResult<IEnumerable<DriverDTO>>> GetNearbyDrivers(
            [FromQuery] double latitude,
            [FromQuery] double longitude,
            [FromQuery] double radius = 10) // Default radius of 10km
        {
            // Get all available and verified drivers
            var drivers = await _context.Drivers
                .Include(d => d.User)
                .Where(d => d.IsAvailable && d.VerificationStatus == "verified" &&
                            d.CurrentLatitude.HasValue && d.CurrentLongitude.HasValue)
                .ToListAsync();

            // Filter drivers by distance
            // Note: In a real app, this would be done with a geospatial query in the database
            var nearbyDrivers = drivers
                .Where(d => CalculateDistance(
                    latitude, longitude,
                    d.CurrentLatitude.Value, d.CurrentLongitude.Value) <= radius)
                .Select(MapDriverToDto)
                .ToList();

            return Ok(nearbyDrivers);
        }

        // Private helper methods
        private DriverDTO MapDriverToDto(Driver driver)
        {
            return new DriverDTO
            {
                Id = driver.Id,
                UserId = driver.UserId,
                User = new UserDTO
                {
                    Id = driver.User.Id,
                    Email = driver.User.Email,
                    FirstName = driver.User.FirstName,
                    LastName = driver.User.LastName,
                    PhoneNumber = driver.User.PhoneNumber,
                    Address = driver.User.Address,
                    AvatarUrl = driver.User.AvatarUrl,
                    IsVerified = driver.User.IsVerified,
                    UserType = driver.User.UserType
                },
                VehicleType = driver.VehicleType,
                LicensePlate = driver.LicensePlate,
                Capacity = driver.Capacity,
                IsAvailable = driver.IsAvailable,
                CurrentLatitude = driver.CurrentLatitude,
                CurrentLongitude = driver.CurrentLongitude,
                Rating = driver.Rating,
                VerificationStatus = driver.VerificationStatus
            };
        }

        private double CalculateDistance(double lat1, double lon1, double lat2, double lon2)
        {
            // Haversine formula to calculate distance between two points
            const double EarthRadiusKm = 6371;
            
            var dLat = ToRadians(lat2 - lat1);
            var dLon = ToRadians(lon2 - lon1);
            
            var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                    Math.Cos(ToRadians(lat1)) * Math.Cos(ToRadians(lat2)) *
                    Math.Sin(dLon / 2) * Math.Sin(dLon / 2);
            
            var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
            
            return EarthRadiusKm * c;
        }

        private double ToRadians(double degrees)
        {
            return degrees * Math.PI / 180;
        }
    }
}