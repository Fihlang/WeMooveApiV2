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
    [Authorize]
    public class DeliveriesController : ControllerBase
    {
        private readonly ApplicationDbContext _dbContext;
        private readonly IWebSocketService _webSocketService;
        private readonly INotificationService _notificationService;

        public DeliveriesController(
            ApplicationDbContext dbContext,
            IWebSocketService webSocketService,
            INotificationService notificationService)
        {
            _dbContext = dbContext;
            _webSocketService = webSocketService;
            _notificationService = notificationService;
        }

        [HttpGet]
        public async Task<ActionResult<ApiResponse<List<DeliveryDTO>>>> GetDeliveries()
        {
            // Get user ID from token claims
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out var userId))
            {
                return BadRequest(ApiResponse<List<DeliveryDTO>>.ErrorResponse("Invalid user ID in token"));
            }

            // Get user
            var user = await _dbContext.Users.FindAsync(userId);
            if (user == null)
            {
                return NotFound(ApiResponse<List<DeliveryDTO>>.ErrorResponse("User not found"));
            }

            // Get deliveries based on user type
            List<Delivery> deliveries;
            if (user.UserType == "customer")
            {
                deliveries = await _dbContext.Deliveries
                    .Include(d => d.Customer)
                    .Include(d => d.Driver)
                    .ThenInclude(d => d.User)
                    .Include(d => d.Items)
                    .ThenInclude(i => i.Furniture)
                    .Include(d => d.Payment)
                    .Where(d => d.CustomerId == userId)
                    .OrderByDescending(d => d.CreatedAt)
                    .ToListAsync();
            }
            else if (user.UserType == "driver")
            {
                var driver = await _dbContext.Drivers.FirstOrDefaultAsync(d => d.UserId == userId);
                if (driver == null)
                {
                    return NotFound(ApiResponse<List<DeliveryDTO>>.ErrorResponse("Driver record not found"));
                }

                deliveries = await _dbContext.Deliveries
                    .Include(d => d.Customer)
                    .Include(d => d.Driver)
                    .ThenInclude(d => d.User)
                    .Include(d => d.Items)
                    .ThenInclude(i => i.Furniture)
                    .Include(d => d.Payment)
                    .Where(d => d.DriverId == driver.Id)
                    .OrderByDescending(d => d.CreatedAt)
                    .ToListAsync();
            }
            else // Admin or other user types can see all deliveries
            {
                deliveries = await _dbContext.Deliveries
                    .Include(d => d.Customer)
                    .Include(d => d.Driver)
                    .ThenInclude(d => d.User)
                    .Include(d => d.Items)
                    .ThenInclude(i => i.Furniture)
                    .Include(d => d.Payment)
                    .OrderByDescending(d => d.CreatedAt)
                    .ToListAsync();
            }

            // Map to DTOs
            var deliveryDTOs = deliveries.Select(d => MapDeliveryToDTO(d)).ToList();

            // Return successful response
            return Ok(ApiResponse<List<DeliveryDTO>>.SuccessResponse(deliveryDTOs));
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<ApiResponse<DeliveryDTO>>> GetDelivery(int id)
        {
            // Get user ID from token claims
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out var userId))
            {
                return BadRequest(ApiResponse<DeliveryDTO>.ErrorResponse("Invalid user ID in token"));
            }

            // Get user
            var user = await _dbContext.Users.FindAsync(userId);
            if (user == null)
            {
                return NotFound(ApiResponse<DeliveryDTO>.ErrorResponse("User not found"));
            }

            // Get delivery with includes
            var delivery = await _dbContext.Deliveries
                .Include(d => d.Customer)
                .Include(d => d.Driver)
                .ThenInclude(d => d.User)
                .Include(d => d.Items)
                .ThenInclude(i => i.Furniture)
                .Include(d => d.Payment)
                .FirstOrDefaultAsync(d => d.Id == id);

            if (delivery == null)
            {
                return NotFound(ApiResponse<DeliveryDTO>.ErrorResponse("Delivery not found"));
            }

            // Check permissions
            if (user.UserType == "customer" && delivery.CustomerId != userId)
            {
                return Forbid();
            }
            else if (user.UserType == "driver")
            {
                var driver = await _dbContext.Drivers.FirstOrDefaultAsync(d => d.UserId == userId);
                if (driver == null || delivery.DriverId != driver.Id)
                {
                    return Forbid();
                }
            }

            // Map to DTO
            var deliveryDTO = MapDeliveryToDTO(delivery);

            // Return successful response
            return Ok(ApiResponse<DeliveryDTO>.SuccessResponse(deliveryDTO));
        }

        [HttpPost]
        public async Task<ActionResult<ApiResponse<DeliveryDTO>>> CreateDelivery(CreateDeliveryRequest request)
        {
            // Get user ID from token claims
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out var userId))
            {
                return BadRequest(ApiResponse<DeliveryDTO>.ErrorResponse("Invalid user ID in token"));
            }

            // Get customer
            var customer = await _dbContext.Users.FindAsync(request.CustomerId);
            if (customer == null)
            {
                return NotFound(ApiResponse<DeliveryDTO>.ErrorResponse("Customer not found"));
            }

            // Verify furniture items
            foreach (var item in request.Items)
            {
                var furniture = await _dbContext.Furniture.FindAsync(item.FurnitureId);
                if (furniture == null)
                {
                    return NotFound(ApiResponse<DeliveryDTO>.ErrorResponse($"Furniture with ID {item.FurnitureId} not found"));
                }
            }

            // Generate tracking number
            var trackingNumber = GenerateTrackingNumber();

            // Create delivery
            var delivery = new Delivery
            {
                CustomerId = request.CustomerId,
                Status = "pending",
                ScheduledDate = request.ScheduledDate,
                TotalPrice = request.TotalPrice,
                PickupAddress = request.PickupAddress,
                DestinationAddress = request.DestinationAddress,
                TrackingNumber = trackingNumber,
                Notes = request.Notes,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _dbContext.Deliveries.Add(delivery);
            await _dbContext.SaveChangesAsync();

            // Create delivery items
            foreach (var itemRequest in request.Items)
            {
                var item = new DeliveryItem
                {
                    DeliveryId = delivery.Id,
                    FurnitureId = itemRequest.FurnitureId,
                    Quantity = itemRequest.Quantity,
                    SpecialHandling = itemRequest.SpecialHandling
                };

                _dbContext.DeliveryItems.Add(item);
            }

            // Create payment record if payment method is provided
            if (!string.IsNullOrEmpty(request.PaymentMethod))
            {
                var payment = new Payment
                {
                    DeliveryId = delivery.Id,
                    Method = request.PaymentMethod,
                    Status = "pending",
                    Amount = request.TotalPrice,
                    CreatedAt = DateTime.UtcNow
                };

                _dbContext.Payments.Add(payment);
            }

            await _dbContext.SaveChangesAsync();

            // Send notification to customer
            await _notificationService.CreateNotification(
                request.CustomerId,
                "info",
                "Delivery Created",
                $"Your delivery with tracking number {trackingNumber} has been created and is pending assignment.",
                "delivery",
                delivery.Id);

            // Broadcast to all available drivers
            await _webSocketService.BroadcastToDrivers(new WebSocketMessage
            {
                Type = "new_delivery",
                Data = new
                {
                    DeliveryId = delivery.Id,
                    CustomerName = $"{customer.FirstName} {customer.LastName}",
                    PickupAddress = delivery.PickupAddress,
                    DestinationAddress = delivery.DestinationAddress,
                    ScheduledDate = delivery.ScheduledDate,
                    TotalPrice = delivery.TotalPrice
                }
            });

            // Fetch the complete delivery with includes
            var createdDelivery = await _dbContext.Deliveries
                .Include(d => d.Customer)
                .Include(d => d.Items)
                .ThenInclude(i => i.Furniture)
                .Include(d => d.Payment)
                .FirstOrDefaultAsync(d => d.Id == delivery.Id);

            // Map to DTO
            var deliveryDTO = MapDeliveryToDTO(createdDelivery);

            // Return successful response
            return CreatedAtAction(
                nameof(GetDelivery),
                new { id = delivery.Id },
                ApiResponse<DeliveryDTO>.SuccessResponse(deliveryDTO, "Delivery created successfully")
            );
        }

        [HttpPut("{id}/status")]
        public async Task<ActionResult<ApiResponse<DeliveryDTO>>> UpdateDeliveryStatus(int id, UpdateDeliveryStatusRequest request)
        {
            // Get user ID from token claims
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out var userId))
            {
                return BadRequest(ApiResponse<DeliveryDTO>.ErrorResponse("Invalid user ID in token"));
            }

            // Get user
            var user = await _dbContext.Users.FindAsync(userId);
            if (user == null)
            {
                return NotFound(ApiResponse<DeliveryDTO>.ErrorResponse("User not found"));
            }

            // Get delivery
            var delivery = await _dbContext.Deliveries
                .Include(d => d.Customer)
                .Include(d => d.Driver)
                .ThenInclude(d => d.User)
                .Include(d => d.Items)
                .ThenInclude(i => i.Furniture)
                .Include(d => d.Payment)
                .FirstOrDefaultAsync(d => d.Id == id);

            if (delivery == null)
            {
                return NotFound(ApiResponse<DeliveryDTO>.ErrorResponse("Delivery not found"));
            }

            // Check permissions
            if (user.UserType == "customer" && delivery.CustomerId != userId)
            {
                return Forbid();
            }
            else if (user.UserType == "driver")
            {
                var driver = await _dbContext.Drivers.FirstOrDefaultAsync(d => d.UserId == userId);
                if (driver == null || delivery.DriverId != driver.Id)
                {
                    return Forbid();
                }
            }

            // Update status and updated at
            delivery.Status = request.Status;
            delivery.UpdatedAt = DateTime.UtcNow;

            // If status is 'delivered', update payment status if exists
            if (request.Status == "delivered" && delivery.Payment != null)
            {
                delivery.Payment.Status = "completed";
                delivery.Payment.PaidAt = DateTime.UtcNow;
            }

            await _dbContext.SaveChangesAsync();

            // Send notification to customer
            var statusMessage = GetStatusMessage(request.Status);
            await _notificationService.CreateNotification(
                delivery.CustomerId,
                "info",
                "Delivery Status Updated",
                statusMessage,
                "delivery",
                delivery.Id);

            // If delivery has a driver, notify the driver as well
            if (delivery.DriverId.HasValue && delivery.CustomerId != userId)
            {
                var driverId = delivery.Driver.UserId;
                await _notificationService.CreateNotification(
                    driverId,
                    "info",
                    "Delivery Status Updated",
                    statusMessage,
                    "delivery",
                    delivery.Id);
            }

            // Broadcast delivery status update via WebSockets
            await _webSocketService.BroadcastDeliveryStatusUpdate(delivery.Id, request.Status);

            // Map to DTO
            var deliveryDTO = MapDeliveryToDTO(delivery);

            // Return successful response
            return Ok(ApiResponse<DeliveryDTO>.SuccessResponse(deliveryDTO, "Delivery status updated successfully"));
        }

        [HttpPut("{id}/driver")]
        public async Task<ActionResult<ApiResponse<DeliveryDTO>>> AssignDriver(int id, AssignDriverRequest request)
        {
            // Get user ID from token claims
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out var userId))
            {
                return BadRequest(ApiResponse<DeliveryDTO>.ErrorResponse("Invalid user ID in token"));
            }

            // Get delivery
            var delivery = await _dbContext.Deliveries
                .Include(d => d.Customer)
                .Include(d => d.Items)
                .ThenInclude(i => i.Furniture)
                .Include(d => d.Payment)
                .FirstOrDefaultAsync(d => d.Id == id);

            if (delivery == null)
            {
                return NotFound(ApiResponse<DeliveryDTO>.ErrorResponse("Delivery not found"));
            }

            // Get driver
            var driver = await _dbContext.Drivers
                .Include(d => d.User)
                .FirstOrDefaultAsync(d => d.Id == request.DriverId);

            if (driver == null)
            {
                return NotFound(ApiResponse<DeliveryDTO>.ErrorResponse("Driver not found"));
            }

            // Update delivery
            delivery.DriverId = driver.Id;
            delivery.Status = "assigned";
            delivery.UpdatedAt = DateTime.UtcNow;

            await _dbContext.SaveChangesAsync();

            // Send notification to customer
            await _notificationService.CreateNotification(
                delivery.CustomerId,
                "info",
                "Driver Assigned",
                $"A driver has been assigned to your delivery. {driver.User.FirstName} {driver.User.LastName} will be handling your delivery.",
                "delivery",
                delivery.Id);

            // Send notification to driver
            await _notificationService.CreateNotification(
                driver.UserId,
                "info",
                "New Delivery Assignment",
                $"You have been assigned to a new delivery from {delivery.PickupAddress} to {delivery.DestinationAddress}.",
                "delivery",
                delivery.Id);

            // Broadcast driver assignment via WebSockets
            await _webSocketService.SendToDelivery(delivery.Id, new WebSocketMessage
            {
                Type = "driver_assigned",
                Data = new
                {
                    DeliveryId = delivery.Id,
                    Driver = new
                    {
                        Id = driver.Id,
                        UserId = driver.UserId,
                        Name = $"{driver.User.FirstName} {driver.User.LastName}",
                        VehicleType = driver.VehicleType,
                        LicensePlate = driver.LicensePlate,
                        Rating = driver.Rating
                    }
                }
            });

            // Refetch the delivery with driver included
            delivery = await _dbContext.Deliveries
                .Include(d => d.Customer)
                .Include(d => d.Driver)
                .ThenInclude(d => d.User)
                .Include(d => d.Items)
                .ThenInclude(i => i.Furniture)
                .Include(d => d.Payment)
                .FirstOrDefaultAsync(d => d.Id == id);

            // Map to DTO
            var deliveryDTO = MapDeliveryToDTO(delivery);

            // Return successful response
            return Ok(ApiResponse<DeliveryDTO>.SuccessResponse(deliveryDTO, "Driver assigned successfully"));
        }

        [HttpGet("available")]
        [Authorize(Roles = "driver")]
        public async Task<ActionResult<ApiResponse<List<DeliveryDTO>>>> GetAvailableDeliveries()
        {
            // Get user ID from token claims
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out var userId))
            {
                return BadRequest(ApiResponse<List<DeliveryDTO>>.ErrorResponse("Invalid user ID in token"));
            }

            // Get driver
            var driver = await _dbContext.Drivers.FirstOrDefaultAsync(d => d.UserId == userId);
            if (driver == null)
            {
                return NotFound(ApiResponse<List<DeliveryDTO>>.ErrorResponse("Driver record not found"));
            }

            // Get available deliveries (pending status, no driver assigned)
            var deliveries = await _dbContext.Deliveries
                .Include(d => d.Customer)
                .Include(d => d.Items)
                .ThenInclude(i => i.Furniture)
                .Where(d => d.Status == "pending" && d.DriverId == null)
                .OrderByDescending(d => d.CreatedAt)
                .ToListAsync();

            // Map to DTOs
            var deliveryDTOs = deliveries.Select(d => MapDeliveryToDTO(d)).ToList();

            // Return successful response
            return Ok(ApiResponse<List<DeliveryDTO>>.SuccessResponse(deliveryDTOs));
        }

        private string GenerateTrackingNumber()
        {
            // Generate a unique tracking number
            var timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
            var random = new Random();
            var randomPart = random.Next(1000, 9999);
            return $"FD-{timestamp}-{randomPart}";
        }

        private string GetStatusMessage(string status)
        {
            return status switch
            {
                "pending" => "Your delivery is pending and awaiting driver assignment.",
                "assigned" => "A driver has been assigned to your delivery.",
                "in_transit" => "Your delivery is now in transit.",
                "delivered" => "Your delivery has been successfully delivered.",
                "cancelled" => "Your delivery has been cancelled.",
                _ => $"Your delivery status has been updated to {status}."
            };
        }

        private DeliveryDTO MapDeliveryToDTO(Delivery delivery)
        {
            var dto = new DeliveryDTO
            {
                Id = delivery.Id,
                CreatedAt = delivery.CreatedAt,
                UpdatedAt = delivery.UpdatedAt,
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
                Status = delivery.Status,
                ScheduledDate = delivery.ScheduledDate,
                TotalPrice = delivery.TotalPrice,
                PickupAddress = delivery.PickupAddress,
                DestinationAddress = delivery.DestinationAddress,
                TrackingNumber = delivery.TrackingNumber,
                Notes = delivery.Notes,
                EstimatedTime = delivery.EstimatedTime,
                Distance = delivery.Distance,
                Items = delivery.Items?.Select(i => new DeliveryItemDTO
                {
                    Id = i.Id,
                    DeliveryId = i.DeliveryId,
                    FurnitureId = i.FurnitureId,
                    Furniture = new FurnitureDTO
                    {
                        Id = i.Furniture.Id,
                        Name = i.Furniture.Name,
                        Description = i.Furniture.Description,
                        Weight = i.Furniture.Weight,
                        Dimensions = i.Furniture.Dimensions,
                        Category = i.Furniture.Category,
                        ImageUrl = i.Furniture.ImageUrl
                    },
                    Quantity = i.Quantity,
                    SpecialHandling = i.SpecialHandling
                }).ToList() ?? new List<DeliveryItemDTO>()
            };

            // Add driver details if assigned
            if (delivery.Driver != null && delivery.Driver.User != null)
            {
                dto.Driver = new DriverDTO
                {
                    Id = delivery.Driver.Id,
                    UserId = delivery.Driver.UserId,
                    VehicleType = delivery.Driver.VehicleType,
                    LicensePlate = delivery.Driver.LicensePlate,
                    Capacity = delivery.Driver.Capacity,
                    Rating = delivery.Driver.Rating,
                    IsAvailable = delivery.Driver.IsAvailable,
                    CurrentLatitude = delivery.Driver.CurrentLatitude,
                    CurrentLongitude = delivery.Driver.CurrentLongitude,
                    VerificationStatus = delivery.Driver.VerificationStatus
                };
            }

            // Add payment details if exists
            if (delivery.Payment != null)
            {
                dto.Payment = new PaymentDTO
                {
                    Id = delivery.Payment.Id,
                    DeliveryId = delivery.Payment.DeliveryId,
                    Method = delivery.Payment.Method,
                    Status = delivery.Payment.Status,
                    Amount = delivery.Payment.Amount,
                    CreatedAt = delivery.Payment.CreatedAt,
                    PaidAt = delivery.Payment.PaidAt
                };
            }

            return dto;
        }
    }
}