using System.Net.WebSockets;

namespace FurnitureDelivery.API.Services
{
    public interface IWebSocketService
    {
        /// <summary>
        /// Registers a new WebSocket connection for a user
        /// </summary>
        /// <param name="userId">The user ID</param>
        /// <param name="connectionId">The connection ID</param>
        void AddConnection(int userId, string connectionId);

        /// <summary>
        /// Removes a WebSocket connection
        /// </summary>
        /// <param name="connectionId">The connection ID to remove</param>
        void RemoveConnection(string connectionId);

        /// <summary>
        /// Gets all connection IDs for a user
        /// </summary>
        /// <param name="userId">The user ID</param>
        /// <returns>List of connection IDs</returns>
        List<string> GetConnectionsForUser(int userId);

        /// <summary>
        /// Sends a message to a specific user via all their connections
        /// </summary>
        /// <param name="userId">The user ID to send to</param>
        /// <param name="message">The message object to send</param>
        Task SendToUser(int userId, object message);

        /// <summary>
        /// Sends a message to all users involved in a delivery
        /// (customer and assigned driver if any)
        /// </summary>
        /// <param name="deliveryId">The delivery ID</param>
        /// <param name="message">The message object to send</param>
        Task SendToDelivery(int deliveryId, object message);

        /// <summary>
        /// Sends a message to a specific driver
        /// </summary>
        /// <param name="driverId">The driver ID</param>
        /// <param name="message">The message object to send</param>
        Task SendToDriver(int driverId, object message);

        /// <summary>
        /// Broadcasts a message to all connected drivers
        /// </summary>
        /// <param name="message">The message to broadcast</param>
        Task BroadcastToDrivers(object message);

        /// <summary>
        /// Broadcasts a driver's location update to relevant parties
        /// </summary>
        /// <param name="driverId">The driver ID</param>
        /// <param name="latitude">Current latitude</param>
        /// <param name="longitude">Current longitude</param>
        Task BroadcastLocationUpdate(int driverId, double latitude, double longitude);

        /// <summary>
        /// Broadcasts a delivery status update to all relevant parties
        /// </summary>
        /// <param name="deliveryId">The delivery ID</param>
        /// <param name="status">The new status</param>
        Task BroadcastDeliveryStatusUpdate(int deliveryId, string status);
    }
}