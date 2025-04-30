using System.Collections.Concurrent;
using FurnitureDelivery.API.Data;
using FurnitureDelivery.API.DTOs;
using Microsoft.EntityFrameworkCore;
using System.Net.WebSockets;
using System.Text;
using System.Text.Json;

namespace FurnitureDelivery.API.Services
{
    public class WebSocketService : IWebSocketService
    {
        private readonly ApplicationDbContext _dbContext;
        private readonly ConcurrentDictionary<string, WebSocketConnection> _connections = new();
        private readonly ConcurrentDictionary<int, HashSet<string>> _userConnections = new();
        private readonly ConcurrentDictionary<int, HashSet<string>> _deliveryConnections = new();
        private readonly ConcurrentDictionary<string, HashSet<string>> _driverConnections = new();

        public WebSocketService(ApplicationDbContext dbContext)
        {
            _dbContext = dbContext;
            _driverConnections["drivers"] = new HashSet<string>();
        }

        public async Task SendToUser(int userId, WebSocketMessage message)
        {
            if (_userConnections.TryGetValue(userId, out var connectionIds))
            {
                foreach (var connectionId in connectionIds)
                {
                    if (_connections.TryGetValue(connectionId, out var connection) && 
                        connection.Socket.State == WebSocketState.Open)
                    {
                        await SendMessageAsync(connection.Socket, message);
                    }
                }
            }
        }

        public async Task SendToDelivery(int deliveryId, WebSocketMessage message)
        {
            if (_deliveryConnections.TryGetValue(deliveryId, out var connectionIds))
            {
                foreach (var connectionId in connectionIds)
                {
                    if (_connections.TryGetValue(connectionId, out var connection) && 
                        connection.Socket.State == WebSocketState.Open)
                    {
                        await SendMessageAsync(connection.Socket, message);
                    }
                }
            }
        }

        public async Task BroadcastToDrivers(WebSocketMessage message)
        {
            if (_driverConnections.TryGetValue("drivers", out var connectionIds))
            {
                foreach (var connectionId in connectionIds)
                {
                    if (_connections.TryGetValue(connectionId, out var connection) && 
                        connection.Socket.State == WebSocketState.Open &&
                        connection.UserType == "driver")
                    {
                        await SendMessageAsync(connection.Socket, message);
                    }
                }
            }
        }

        public async Task BroadcastLocationUpdate(int driverId, double latitude, double longitude)
        {
            // Get all active deliveries for driver
            var driver = await _dbContext.Drivers
                .Include(d => d.User)
                .FirstOrDefaultAsync(d => d.Id == driverId);

            if (driver == null)
            {
                return;
            }

            var activeDeliveries = await _dbContext.Deliveries
                .Where(d => d.DriverId == driverId && 
                       (d.Status == "assigned" || d.Status == "in_transit"))
                .ToListAsync();

            // Location update message
            var locationMessage = new WebSocketMessage
            {
                Type = "location_update",
                Data = new
                {
                    DriverId = driverId,
                    UserId = driver.UserId,
                    DriverName = $"{driver.User.FirstName} {driver.User.LastName}",
                    Latitude = latitude,
                    Longitude = longitude,
                    Timestamp = DateTime.UtcNow
                }
            };

            // Broadcast to each active delivery
            foreach (var delivery in activeDeliveries)
            {
                await SendToDelivery(delivery.Id, locationMessage);
            }
        }

        public async Task BroadcastDeliveryStatusUpdate(int deliveryId, string status)
        {
            var delivery = await _dbContext.Deliveries
                .Include(d => d.Customer)
                .Include(d => d.Driver)
                .ThenInclude(d => d.User)
                .FirstOrDefaultAsync(d => d.Id == deliveryId);

            if (delivery == null)
            {
                return;
            }

            var statusMessage = new WebSocketMessage
            {
                Type = "status_update",
                Data = new
                {
                    DeliveryId = deliveryId,
                    Status = status,
                    PreviousStatus = delivery.Status,
                    UpdatedAt = DateTime.UtcNow
                }
            };

            await SendToDelivery(deliveryId, statusMessage);
        }

        public async Task RegisterConnection(string connectionId, int userId, string userType)
        {
            if (_connections.TryGetValue(connectionId, out var connection))
            {
                connection.UserId = userId;
                connection.UserType = userType;
            }

            _userConnections.AddOrUpdate(
                userId,
                new HashSet<string> { connectionId },
                (_, existingIds) =>
                {
                    lock (existingIds)
                    {
                        existingIds.Add(connectionId);
                        return existingIds;
                    }
                });

            // If driver, add to driver connections
            if (userType == "driver")
            {
                _driverConnections.AddOrUpdate(
                    "drivers",
                    new HashSet<string> { connectionId },
                    (_, existingIds) =>
                    {
                        lock (existingIds)
                        {
                            existingIds.Add(connectionId);
                            return existingIds;
                        }
                    });
            }
            
            await Task.CompletedTask;
        }

        public Task RemoveConnection(string connectionId)
        {
            if (_connections.TryRemove(connectionId, out var connection))
            {
                // Remove from user connections
                if (connection.UserId.HasValue && 
                    _userConnections.TryGetValue(connection.UserId.Value, out var userConnections))
                {
                    lock (userConnections)
                    {
                        userConnections.Remove(connectionId);
                        
                        // If no more connections for this user, remove the entry
                        if (userConnections.Count == 0)
                        {
                            _userConnections.TryRemove(connection.UserId.Value, out _);
                        }
                    }
                }

                // Remove from driver connections
                if (connection.UserType == "driver" && 
                    _driverConnections.TryGetValue("drivers", out var driverConnections))
                {
                    lock (driverConnections)
                    {
                        driverConnections.Remove(connectionId);
                    }
                }

                // Remove from delivery connections
                foreach (var deliveryId in connection.DeliveryIds)
                {
                    if (_deliveryConnections.TryGetValue(deliveryId, out var deliveryConnections))
                    {
                        lock (deliveryConnections)
                        {
                            deliveryConnections.Remove(connectionId);
                            
                            // If no more connections for this delivery, remove the entry
                            if (deliveryConnections.Count == 0)
                            {
                                _deliveryConnections.TryRemove(deliveryId, out _);
                            }
                        }
                    }
                }
            }

            return Task.CompletedTask;
        }

        public Task JoinDelivery(string connectionId, int deliveryId)
        {
            if (_connections.TryGetValue(connectionId, out var connection))
            {
                connection.DeliveryIds.Add(deliveryId);
            }

            _deliveryConnections.AddOrUpdate(
                deliveryId,
                new HashSet<string> { connectionId },
                (_, existingIds) =>
                {
                    lock (existingIds)
                    {
                        existingIds.Add(connectionId);
                        return existingIds;
                    }
                });

            return Task.CompletedTask;
        }

        public Task LeaveDelivery(string connectionId, int deliveryId)
        {
            if (_connections.TryGetValue(connectionId, out var connection))
            {
                connection.DeliveryIds.Remove(deliveryId);
            }

            if (_deliveryConnections.TryGetValue(deliveryId, out var deliveryConnections))
            {
                lock (deliveryConnections)
                {
                    deliveryConnections.Remove(connectionId);
                    
                    // If no more connections for this delivery, remove the entry
                    if (deliveryConnections.Count == 0)
                    {
                        _deliveryConnections.TryRemove(deliveryId, out _);
                    }
                }
            }

            return Task.CompletedTask;
        }

        public void AddConnection(string connectionId, WebSocket socket)
        {
            _connections[connectionId] = new WebSocketConnection
            {
                Socket = socket,
                ConnectionId = connectionId
            };
        }

        private static async Task SendMessageAsync(WebSocket socket, WebSocketMessage message)
        {
            if (socket.State != WebSocketState.Open)
                return;

            try
            {
                var json = JsonSerializer.Serialize(message);
                var bytes = Encoding.UTF8.GetBytes(json);
                await socket.SendAsync(
                    new ArraySegment<byte>(bytes),
                    WebSocketMessageType.Text,
                    true,
                    CancellationToken.None);
            }
            catch (Exception)
            {
                // Log the exception but don't rethrow - we don't want to crash the service
                // In a production app, you'd log this properly
            }
        }

        private class WebSocketConnection
        {
            public WebSocket Socket { get; set; } = null!;
            public string ConnectionId { get; set; } = string.Empty;
            public int? UserId { get; set; }
            public string UserType { get; set; } = string.Empty;
            public HashSet<int> DeliveryIds { get; } = new HashSet<int>();
        }
    }
}