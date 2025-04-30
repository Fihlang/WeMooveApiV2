using FurnitureDelivery.API.DTOs;

namespace FurnitureDelivery.API.Services
{
    public class WebSocketMessage
    {
        public string Type { get; set; } = string.Empty;
        public object? Data { get; set; }
    }

    public interface IWebSocketService
    {
        /// <summary>
        /// Sends a message to a specific user
        /// </summary>
        /// <param name="userId">The user ID</param>
        /// <param name="message">The message to send</param>
        Task SendToUser(int userId, WebSocketMessage message);
        
        /// <summary>
        /// Broadcasts a message to all clients connected to a specific delivery
        /// </summary>
        /// <param name="deliveryId">The delivery ID</param>
        /// <param name="message">The message to broadcast</param>
        Task SendToDelivery(int deliveryId, WebSocketMessage message);
        
        /// <summary>
        /// Broadcasts a message to all connected drivers
        /// </summary>
        /// <param name="message">The message to broadcast</param>
        Task BroadcastToDrivers(WebSocketMessage message);
        
        /// <summary>
        /// Broadcasts a location update to all relevant parties
        /// </summary>
        /// <param name="driverId">The driver ID</param>
        /// <param name="latitude">The current latitude</param>
        /// <param name="longitude">The current longitude</param>
        Task BroadcastLocationUpdate(int driverId, double latitude, double longitude);
        
        /// <summary>
        /// Broadcasts a delivery status update to all relevant parties
        /// </summary>
        /// <param name="deliveryId">The delivery ID</param>
        /// <param name="status">The new status</param>
        Task BroadcastDeliveryStatusUpdate(int deliveryId, string status);
        
        /// <summary>
        /// Registers a client connection with associated metadata
        /// </summary>
        /// <param name="connectionId">The connection ID</param>
        /// <param name="userId">The user ID</param>
        /// <param name="userType">The user type (customer, driver, admin)</param>
        Task RegisterConnection(string connectionId, int userId, string userType);
        
        /// <summary>
        /// Removes a client connection
        /// </summary>
        /// <param name="connectionId">The connection ID</param>
        Task RemoveConnection(string connectionId);
        
        /// <summary>
        /// Registers a client connection with a specific delivery
        /// </summary>
        /// <param name="connectionId">The connection ID</param>
        /// <param name="deliveryId">The delivery ID</param>
        Task JoinDelivery(string connectionId, int deliveryId);
        
        /// <summary>
        /// Removes a client connection from a specific delivery
        /// </summary>
        /// <param name="connectionId">The connection ID</param>
        /// <param name="deliveryId">The delivery ID</param>
        Task LeaveDelivery(string connectionId, int deliveryId);
    }
}