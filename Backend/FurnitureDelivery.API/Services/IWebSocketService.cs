using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace FurnitureDelivery.API.Services
{
    public interface IWebSocketService
    {
        void AddConnection(int userId, string connectionId);
        
        void RemoveConnection(string connectionId);
        
        List<string> GetConnectionsForUser(int userId);
        
        Task SendToUser(int userId, object message);
        
        Task SendToDelivery(int deliveryId, object message);
        
        Task SendToDriver(int driverId, object message);
        
        Task BroadcastToDrivers(object message);
        
        Task BroadcastLocationUpdate(int driverId, double latitude, double longitude);
        
        Task BroadcastDeliveryStatusUpdate(int deliveryId, string status);
    }
}