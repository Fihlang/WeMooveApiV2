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
using System.Text.Json;
using System.Threading.Tasks;

namespace FurnitureDelivery.API.Controllers
{
    [Route("api/deliveries")]
    [ApiController]
    [Authorize]
    public class DeliveriesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly INotificationService _notificationService;
        private readonly IWebSocketService _webSocketService;

        public DeliveriesController(
            ApplicationDbContext context, 
            INotificationService notificationService,
            IWebSocketService webSocketService)
        {
            _context = context;
            _notificationService = notificationService;
            _webSocketService = webSocketService;
        }

        // GET: api/deliveries
        [HttpGet]
        public async Task<ActionResult<IEnumerable<DeliverySummaryDTO>>> GetDeliveries()
        {
            // Get user ID from claims
            int userId = int.Parse(User.FindFirst("uid")?.Value);
            string userType = User.FindFirst("user_type")?.Value;

            // Filter deliveries based on user type
            var deliveriesQuery = userType == "customer" 
                ? _context.Deliveries.Where(d => d.CustomerId == userId)
                : userType == "driver"
                    ? _context.Deliveries.Include(d => d.Driver)
                        .Where(d => d.Driver.UserId == userId)
                    : throw new UnauthorizedAccessException("Invalid user type");

            // Include necessary related data
            var deliveries = await deliveriesQuery
                .Include(d => d.Items)
                .Include(d => d.Driver)
                    .ThenInclude(dr => dr.User)
                .OrderByDescending(d => d.CreatedAt)
                .ToListAsync();

            // Map to DTOs
            var deliverySummaries = deliveries.Select(d => new DeliverySummaryDTO
            {
                Id = d.Id,
                Status = d.Status,
                PickupAddress = d.PickupAddress,
                DestinationAddress = d.DestinationAddress,
                ScheduledDate = d.ScheduledDate,
                TotalPrice = d.TotalPrice,
                ItemCount = d.Items.Count,
                DriverName = d.Driver != null ? $"{d.Driver.User.FirstName} {d.Driver.User.LastName}" : null,
                CreatedAt = d.CreatedAt
            }).ToList();

            return Ok(deliverySummaries);
        }

        // GET: api/deliveries/5
        [HttpGet("{id}")]
        public async Task<ActionResult<DeliveryDetailDTO>> GetDelivery(int id)
        {
            // Get user ID from claims
            int userId = int.Parse(User.FindFirst("uid")?.Value);
            string userType = User.FindFirst("user_type")?.Value;

            // Get delivery with related data
            var delivery = await _context.Deliveries
                .Include(d => d.Customer)
                .Include(d => d.Driver)
                    .ThenInclude(dr => dr.User)
                .Include(d => d.Items)
                    .ThenInclude(di => di.Furniture)
                .Include(d => d.Payment)
                .FirstOrDefaultAsync(d => d.Id == id);

            if (delivery == null)
            {
                return NotFound(new { message = "Delivery not found" });
            }

            // Check if user has access to this delivery
            if (userType == "customer" && delivery.CustomerId != userId ||
                userType == "driver" && delivery.Driver?.UserId != userId)
            {
                return Forbid();
            }

            // Map to DTO
            var deliveryDetail = new DeliveryDetailDTO
            {
                Id = delivery.Id,
                CustomerId = delivery.CustomerId,
                Customer = new UserDTO
                {
                    Id = delivery.Customer.Id,
                    Email = delivery.Customer.Email,
                    FirstName = delivery.Customer.FirstName,
                    LastName = delivery.Customer.LastName,
                    PhoneNumber = delivery.Customer.PhoneNumber,
                    Address = delivery.Customer.Address,
                    AvatarUrl = delivery.Customer.AvatarUrl,
                    IsVerified = delivery.Customer.IsVerified,
                    UserType = delivery.Customer.UserType
                },
                DriverId = delivery.DriverId,
                Driver = delivery.Driver != null ? new DriverDTO
                {
                    Id = delivery.Driver.Id,
                    UserId = delivery.Driver.UserId,
                    User = new UserDTO
                    {
                        Id = delivery.Driver.User.Id,
                        FirstName = delivery.Driver.User.FirstName,
                        LastName = delivery.Driver.User.LastName,
                        PhoneNumber = delivery.Driver.User.PhoneNumber,
                        AvatarUrl = delivery.Driver.User.AvatarUrl
                    },
                    VehicleType = delivery.Driver.VehicleType,
                    LicensePlate = delivery.Driver.LicensePlate,
                    Capacity = delivery.Driver.Capacity,
                    IsAvailable = delivery.Driver.IsAvailable,
                    CurrentLatitude = delivery.Driver.CurrentLatitude,
                    CurrentLongitude = delivery.Driver.CurrentLongitude,
                    Rating = delivery.Driver.Rating,
                    VerificationStatus = delivery.Driver.VerificationStatus
                } : null,
                Status = delivery.Status,
                PickupAddress = delivery.PickupAddress,
                PickupLatitude = delivery.PickupLatitude,
                PickupLongitude = delivery.PickupLongitude,
                DestinationAddress = delivery.DestinationAddress,
                DestinationLatitude = delivery.DestinationLatitude,
                DestinationLongitude = delivery.DestinationLongitude,
                ScheduledDate = delivery.ScheduledDate,
                CompletedDate = delivery.CompletedDate,
                TotalPrice = delivery.TotalPrice,
                Distance = delivery.Distance,
                CreatedAt = delivery.CreatedAt,
                UpdatedAt = delivery.UpdatedAt,
                Items = delivery.Items.Select(item => new DeliveryItemDetailDTO
                {
                    Id = item.Id,
                    DeliveryId = item.DeliveryId,
                    FurnitureId = item.FurnitureId,
                    Furniture = new FurnitureDTO
                    {
                        Id = item.Furniture.Id,
                        Name = item.Furniture.Name,
                        Description = item.Furniture.Description,
                        Weight = item.Furniture.Weight,
                        Dimensions = item.Furniture.Dimensions != null 
                            ? JsonSerializer.Deserialize<DimensionsDTO>(item.Furniture.DimensionsJson)
                            : new DimensionsDTO(),
                        Category = item.Furniture.Category,
                        ImageUrl = item.Furniture.ImageUrl
                    },
                    Quantity = item.Quantity,
                    SpecialHandling = item.SpecialHandling
                }).ToList(),
                Payment = delivery.Payment != null ? new PaymentDTO
                {
                    Id = delivery.Payment.Id,
                    DeliveryId = delivery.Payment.DeliveryId,
                    Amount = delivery.Payment.Amount,
                    Status = delivery.Payment.Status,
                    PaymentMethod = delivery.Payment.PaymentMethod,
                    TransactionId = delivery.Payment.TransactionId,
                    CreatedAt = delivery.Payment.CreatedAt,
                    CompletedAt = delivery.Payment.CompletedAt
                } : null
            };

            return Ok(deliveryDetail);
        }

        // POST: api/deliveries
        [HttpPost]
        [Authorize(Roles = "customer")]
        public async Task<ActionResult<DeliveryDetailDTO>> CreateDelivery(CreateDeliveryDTO createDeliveryDto)
        {
            // Get user ID from claims
            int userId = int.Parse(User.FindFirst("uid")?.Value);

            // Validate items
            if (createDeliveryDto.Items == null || !createDeliveryDto.Items.Any())
            {
                return BadRequest(new { message = "Delivery must have at least one item" });
            }

            // Check if furniture items exist
            var furnitureIds = createDeliveryDto.Items.Select(i => i.FurnitureId).ToList();
            var existingFurniture = await _context.Furniture
                .Where(f => furnitureIds.Contains(f.Id))
                .ToListAsync();

            if (existingFurniture.Count != furnitureIds.Count)
            {
                return BadRequest(new { message = "One or more furniture items do not exist" });
            }

            // Calculate total price (example calculation - would be more complex in real app)
            decimal totalPrice = 0;
            foreach (var item in createDeliveryDto.Items)
            {
                var furniture = existingFurniture.First(f => f.Id == item.FurnitureId);
                // Base price per item
                decimal itemPrice = (decimal)furniture.Weight * 2; // $2 per kg
                
                // Add special handling fee if needed
                if (item.SpecialHandling)
                {
                    itemPrice *= 1.25m; // 25% more for special handling
                }
                
                // Multiply by quantity
                itemPrice *= item.Quantity;
                
                totalPrice += itemPrice;
            }
            
            // Add base delivery fee
            totalPrice += 15; // $15 base fee

            // Create new delivery
            var delivery = new Delivery
            {
                CustomerId = userId,
                Status = "pending",
                PickupAddress = createDeliveryDto.PickupAddress,
                PickupLatitude = createDeliveryDto.PickupLatitude,
                PickupLongitude = createDeliveryDto.PickupLongitude,
                DestinationAddress = createDeliveryDto.DestinationAddress,
                DestinationLatitude = createDeliveryDto.DestinationLatitude,
                DestinationLongitude = createDeliveryDto.DestinationLongitude,
                ScheduledDate = createDeliveryDto.ScheduledDate,
                TotalPrice = totalPrice,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            // Save delivery to get ID
            _context.Deliveries.Add(delivery);
            await _context.SaveChangesAsync();

            // Create delivery items
            var deliveryItems = createDeliveryDto.Items.Select(item => new DeliveryItem
            {
                DeliveryId = delivery.Id,
                FurnitureId = item.FurnitureId,
                Quantity = item.Quantity,
                SpecialHandling = item.SpecialHandling
            }).ToList();

            _context.DeliveryItems.AddRange(deliveryItems);

            // Create payment record
            var payment = new Payment
            {
                DeliveryId = delivery.Id,
                Amount = totalPrice,
                Status = "pending",
                PaymentMethod = createDeliveryDto.PaymentMethod,
                CreatedAt = DateTime.UtcNow
            };

            _context.Payments.Add(payment);
            await _context.SaveChangesAsync();

            // Create notification for customer
            await _notificationService.CreateNotification(
                userId,
                "delivery_created",
                "Delivery Created",
                $"Your delivery #{delivery.Id} has been created and is pending driver assignment.",
                "delivery",
                delivery.Id);

            // Get delivery with all related data
            return await GetDelivery(delivery.Id);
        }

        // PATCH: api/deliveries/5/status
        [HttpPatch("{id}/status")]
        public async Task<IActionResult> UpdateDeliveryStatus(int id, UpdateDeliveryStatusDTO updateDto)
        {
            // Get user ID from claims
            int userId = int.Parse(User.FindFirst("uid")?.Value);
            string userType = User.FindFirst("user_type")?.Value;

            var delivery = await _context.Deliveries
                .Include(d => d.Driver)
                .Include(d => d.Customer)
                .FirstOrDefaultAsync(d => d.Id == id);

            if (delivery == null)
            {
                return NotFound(new { message = "Delivery not found" });
            }

            // Check authorization
            if (userType == "customer" && delivery.CustomerId != userId ||
                userType == "driver" && delivery.Driver?.UserId != userId)
            {
                return Forbid();
            }

            // Validate status transition
            if (!IsValidStatusTransition(delivery.Status, updateDto.Status))
            {
                return BadRequest(new { message = $"Cannot transition from {delivery.Status} to {updateDto.Status}" });
            }

            // Update status
            delivery.Status = updateDto.Status;
            delivery.UpdatedAt = DateTime.UtcNow;

            // Set completed date if delivery is completed
            if (updateDto.Status == "completed")
            {
                delivery.CompletedDate = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();

            // Create message if comment is provided
            if (!string.IsNullOrEmpty(updateDto.Comment))
            {
                var message = new Message
                {
                    DeliveryId = delivery.Id,
                    SenderId = userId,
                    SenderType = userType,
                    Content = updateDto.Comment,
                    CreatedAt = DateTime.UtcNow,
                    IsRead = false
                };

                _context.Messages.Add(message);
                await _context.SaveChangesAsync();
            }

            // Create notifications
            string notificationType = $"delivery_{updateDto.Status}";
            string notificationTitle = $"Delivery {updateDto.Status.ToTitleCase()}";
            string notificationMessage = $"Your delivery #{delivery.Id} has been marked as {updateDto.Status}.";

            // Notify customer
            await _notificationService.CreateNotification(
                delivery.CustomerId,
                notificationType,
                notificationTitle,
                notificationMessage,
                "delivery",
                delivery.Id);

            // Notify driver if assigned
            if (delivery.DriverId.HasValue)
            {
                await _notificationService.CreateNotification(
                    delivery.Driver.UserId,
                    notificationType,
                    notificationTitle,
                    notificationMessage,
                    "delivery",
                    delivery.Id);
            }

            // Send WebSocket update
            await _webSocketService.SendDeliveryStatusUpdate(delivery.Id, delivery.Status);

            return Ok(new { message = "Delivery status updated successfully" });
        }

        // PATCH: api/deliveries/5/driver
        [HttpPatch("{id}/driver")]
        [Authorize(Roles = "admin")] // Only admin can assign drivers in this example
        public async Task<IActionResult> AssignDriver(int id, AssignDriverDTO assignDto)
        {
            var delivery = await _context.Deliveries.FindAsync(id);
            if (delivery == null)
            {
                return NotFound(new { message = "Delivery not found" });
            }

            var driver = await _context.Drivers
                .Include(d => d.User)
                .FirstOrDefaultAsync(d => d.Id == assignDto.DriverId);

            if (driver == null)
            {
                return NotFound(new { message = "Driver not found" });
            }

            // Check if driver is verified and available
            if (driver.VerificationStatus != "verified")
            {
                return BadRequest(new { message = "Driver is not verified" });
            }

            if (!driver.IsAvailable)
            {
                return BadRequest(new { message = "Driver is not available" });
            }

            // Assign driver to delivery
            delivery.DriverId = driver.Id;
            delivery.Status = "accepted";
            delivery.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            // Create notifications
            string notificationMessage = $"Driver {driver.User.FirstName} {driver.User.LastName} has been assigned to your delivery #{delivery.Id}.";
            
            // Notify customer
            await _notificationService.CreateNotification(
                delivery.CustomerId,
                "driver_assigned",
                "Driver Assigned",
                notificationMessage,
                "delivery",
                delivery.Id);

            // Notify driver
            await _notificationService.CreateNotification(
                driver.UserId,
                "delivery_assigned",
                "New Delivery Assignment",
                $"You have been assigned to delivery #{delivery.Id}.",
                "delivery",
                delivery.Id);

            // Send WebSocket update
            await _webSocketService.SendDeliveryStatusUpdate(delivery.Id, delivery.Status);

            return Ok(new { message = "Driver assigned successfully" });
        }

        // GET: api/deliveries/active
        [HttpGet("active")]
        public async Task<ActionResult<IEnumerable<DeliverySummaryDTO>>> GetActiveDeliveries()
        {
            // Get user ID from claims
            int userId = int.Parse(User.FindFirst("uid")?.Value);
            string userType = User.FindFirst("user_type")?.Value;

            // Define active statuses
            var activeStatuses = new[] { "pending", "accepted", "picked_up", "in_transit" };

            // Filter deliveries based on user type
            var deliveriesQuery = userType == "customer" 
                ? _context.Deliveries
                    .Where(d => d.CustomerId == userId && activeStatuses.Contains(d.Status))
                : userType == "driver"
                    ? _context.Deliveries.Include(d => d.Driver)
                        .Where(d => d.Driver.UserId == userId && activeStatuses.Contains(d.Status))
                    : throw new UnauthorizedAccessException("Invalid user type");

            // Include necessary related data
            var deliveries = await deliveriesQuery
                .Include(d => d.Items)
                .Include(d => d.Driver)
                    .ThenInclude(dr => dr.User)
                .OrderByDescending(d => d.CreatedAt)
                .ToListAsync();

            // Map to DTOs
            var deliverySummaries = deliveries.Select(d => new DeliverySummaryDTO
            {
                Id = d.Id,
                Status = d.Status,
                PickupAddress = d.PickupAddress,
                DestinationAddress = d.DestinationAddress,
                ScheduledDate = d.ScheduledDate,
                TotalPrice = d.TotalPrice,
                ItemCount = d.Items.Count,
                DriverName = d.Driver != null ? $"{d.Driver.User.FirstName} {d.Driver.User.LastName}" : null,
                CreatedAt = d.CreatedAt
            }).ToList();

            return Ok(deliverySummaries);
        }

        // Private helper methods
        private bool IsValidStatusTransition(string currentStatus, string newStatus)
        {
            // Define valid status transitions
            var validTransitions = new Dictionary<string, string[]>
            {
                { "pending", new[] { "accepted", "cancelled" } },
                { "accepted", new[] { "picked_up", "cancelled" } },
                { "picked_up", new[] { "in_transit", "cancelled" } },
                { "in_transit", new[] { "delivered", "cancelled" } },
                { "delivered", new[] { "completed" } },
                { "completed", new string[] { } }, // Terminal state
                { "cancelled", new string[] { } }  // Terminal state
            };

            return validTransitions.ContainsKey(currentStatus) && 
                validTransitions[currentStatus].Contains(newStatus);
        }
    }

    // Extension method to convert string to title case
    public static class StringExtensions
    {
        public static string ToTitleCase(this string str)
        {
            if (string.IsNullOrEmpty(str))
                return str;

            // Convert from snake_case to Title Case
            return string.Join(" ", str.Split('_')
                .Select(s => char.ToUpper(s[0]) + s.Substring(1)));
        }
    }
}