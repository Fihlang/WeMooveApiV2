using System.ComponentModel.DataAnnotations;

namespace FurnitureDelivery.API.DTOs
{
    public class CreateReviewRequest
    {
        [Required]
        public int DeliveryId { get; set; }

        [Required]
        public int CustomerId { get; set; }

        [Required]
        public int DriverId { get; set; }

        [Required]
        [Range(1, 5, ErrorMessage = "Rating must be between 1 and 5")]
        public int Rating { get; set; }

        public string? Comment { get; set; }
    }

    public class ReviewDTO
    {
        public int Id { get; set; }
        public DateTime CreatedAt { get; set; }
        public int DeliveryId { get; set; }
        public int CustomerId { get; set; }
        public UserDTO Customer { get; set; }
        public int DriverId { get; set; }
        public DriverDTO Driver { get; set; }
        public int Rating { get; set; }
        public string? Comment { get; set; }
    }

    public class CreateMessageRequest
    {
        [Required]
        public int DeliveryId { get; set; }

        [Required]
        public int SenderId { get; set; }

        [Required]
        public int ReceiverId { get; set; }

        [Required]
        public string Content { get; set; }
    }

    public class MessageDTO
    {
        public int Id { get; set; }
        public DateTime CreatedAt { get; set; }
        public int DeliveryId { get; set; }
        public int SenderId { get; set; }
        public UserDTO Sender { get; set; }
        public int ReceiverId { get; set; }
        public UserDTO Receiver { get; set; }
        public string Content { get; set; }
        public bool IsRead { get; set; }
    }

    public class NotificationDTO
    {
        public int Id { get; set; }
        public DateTime CreatedAt { get; set; }
        public int UserId { get; set; }
        public string Type { get; set; }
        public string Title { get; set; }
        public string Message { get; set; }
        public bool IsRead { get; set; }
        public string? RelatedEntityType { get; set; }
        public int? RelatedEntityId { get; set; }
    }

    public class MarkNotificationReadRequest
    {
        [Required]
        public int NotificationId { get; set; }
    }

    public class ApiResponse<T>
    {
        public bool Success { get; set; }
        public string Message { get; set; }
        public T Data { get; set; }

        public static ApiResponse<T> SuccessResponse(T data, string message = "Operation successful")
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

    public class UpdateDriverLocationRequest
    {
        [Required]
        [Range(-90, 90, ErrorMessage = "Latitude must be between -90 and 90")]
        public double Latitude { get; set; }

        [Required]
        [Range(-180, 180, ErrorMessage = "Longitude must be between -180 and 180")]
        public double Longitude { get; set; }
    }

    public class DriverNearbyRequest
    {
        [Required]
        [Range(-90, 90, ErrorMessage = "Latitude must be between -90 and 90")]
        public double Latitude { get; set; }

        [Required]
        [Range(-180, 180, ErrorMessage = "Longitude must be between -180 and 180")]
        public double Longitude { get; set; }

        [Required]
        [Range(0.1, 100, ErrorMessage = "Radius must be between 0.1 and 100 km")]
        public double Radius { get; set; } = 10.0; // Default 10km
    }
}