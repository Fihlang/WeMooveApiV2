using System;
using System.Collections.Generic;

namespace FurnitureDelivery.API.DTOs
{
    public class ApiResponse<T>
    {
        public bool Success { get; set; }
        public string Message { get; set; }
        public T Data { get; set; }
        public List<string> Errors { get; set; } = new List<string>();
        
        public ApiResponse() { }
        
        public ApiResponse(bool success, string message = null, T data = default, List<string> errors = null)
        {
            Success = success;
            Message = message;
            Data = data;
            Errors = errors ?? new List<string>();
        }
        
        public static ApiResponse<T> SuccessResponse(T data, string message = "Operation successful")
        {
            return new ApiResponse<T>
            {
                Success = true,
                Message = message,
                Data = data
            };
        }
        
        public static ApiResponse<T> ErrorResponse(string message, List<string> errors = null)
        {
            return new ApiResponse<T>
            {
                Success = false,
                Message = message,
                Errors = errors ?? new List<string>()
            };
        }
    }
    
    public class PaginatedResponse<T>
    {
        public List<T> Items { get; set; }
        public int TotalCount { get; set; }
        public int PageIndex { get; set; }
        public int PageSize { get; set; }
        public int TotalPages => (int)Math.Ceiling(TotalCount / (double)PageSize);
        public bool HasPreviousPage => PageIndex > 1;
        public bool HasNextPage => PageIndex < TotalPages;
    }
    
    public class PaginationParams
    {
        private const int MaxPageSize = 50;
        private int _pageSize = 10;
        
        public int PageIndex { get; set; } = 1;
        
        public int PageSize
        {
            get => _pageSize;
            set => _pageSize = (value > MaxPageSize) ? MaxPageSize : value;
        }
        
        public string SortBy { get; set; }
        public bool Ascending { get; set; } = true;
    }
    
    public class WebSocketMessage
    {
        public string Type { get; set; }
        public object Data { get; set; }
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    }
    
    public class GeoLocation
    {
        public double Latitude { get; set; }
        public double Longitude { get; set; }
    }
    
    public class DeliveryStatusUpdate
    {
        public int DeliveryId { get; set; }
        public string Status { get; set; }
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
    
    public class DriverLocationUpdate
    {
        public int DriverId { get; set; }
        public GeoLocation Location { get; set; }
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
    
    public class NewMessageNotification
    {
        public int DeliveryId { get; set; }
        public int MessageId { get; set; }
        public int SenderId { get; set; }
        public string SenderType { get; set; }
        public string Content { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}