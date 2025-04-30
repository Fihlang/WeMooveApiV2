using System.Collections.Concurrent;
using System.Net.WebSockets;
using System.Text;
using System.Text.Json;
using FurnitureDelivery.API.Data;
using FurnitureDelivery.API.DTOs;

namespace FurnitureDelivery.API.Services
{
    public class WebSocketService : IWebSocketService
    {
        private readonly ConcurrentDictionary<string, WebSocket> _connections;
        private readonly ConcurrentDictionary<int, HashSet<string>> _userConnections;
        private readonly ConcurrentDictionary<int, HashSet<string>> _deliveryConnections;
        private readonly ConcurrentDictionary<string, int> _connectionToUser;
        private readonly ILogger<WebSocketService> _logger;
        private readonly ApplicationDbContext _dbContext;

        public WebSocketService(ILogger<WebSocketService> logger, ApplicationDbContext dbContext)
        {
            _connections = new ConcurrentDictionary<string, WebSocket>();
            _userConnections = new ConcurrentDictionary<int, HashSet<string>>();
            _deliveryConnections = new ConcurrentDictionary<int, HashSet<string>>();
            _connectionToUser = new ConcurrentDictionary<string, int>();
            _logger = logger;
            _dbContext = dbContext;
        }

        public void AddConnection(string connectionId, WebSocket webSocket)
        {
            _connections.TryAdd(connectionId, webSocket);
            _logger.LogInformation($"WebSocket connection added: {connectionId}");
        }

        public async Task RemoveConnection(string connectionId)
        {
            if (_connections.TryRemove(connectionId, out _))
            {
                _logger.LogInformation($"WebSocket connection removed: {connectionId}");
                
                // Remove user association
                if (_connectionToUser.TryRemove(connectionId, out var userId))
                {
                    if (_userConnections.TryGetValue(userId, out var userConnections))
                    {
                        userConnections.Remove(connectionId);
                        if (userConnections.Count == 0)
                        {
                            _userConnections.TryRemove(userId, out _);
                        }
                    }
                }
                
                // Remove from all delivery associations
                foreach (var delivery in _deliveryConnections)
                {
                    delivery.Value.Remove(connectionId);
                    if (delivery.Value.Count == 0)
                    {
                        _deliveryConnections.TryRemove(delivery.Key, out _);
                    }
                }
            }
        }

        public void AssociateUserWithConnection(int userId, string connectionId)
        {
            _connectionToUser.TryAdd(connectionId, userId);
            
            _userConnections.AddOrUpdate(
                userId,
                new HashSet<string> { connectionId },
                (_, connections) =>
                {
                    connections.Add(connectionId);
                    return connections;
                });
            
            _logger.LogInformation($"User {userId} associated with connection {connectionId}");
        }

        public void AssociateDeliveryWithConnection(int deliveryId, string connectionId)
        {
            _deliveryConnections.AddOrUpdate(
                deliveryId,
                new HashSet<string> { connectionId },
                (_, connections) =>
                {
                    connections.Add(connectionId);
                    return connections;
                });
            
            _logger.LogInformation($"Delivery {deliveryId} associated with connection {connectionId}");
        }

        public List<string> GetConnectionsForUser(int userId)
        {
            if (_userConnections.TryGetValue(userId, out var connections))
            {
                return connections.ToList();
            }
            
            return new List<string>();
        }

        public List<string> GetConnectionsForDelivery(int deliveryId)
        {
            if (_deliveryConnections.TryGetValue(deliveryId, out var connections))
            {
                return connections.ToList();
            }
            
            return new List<string>();
        }

        public async Task SendToUser(int userId, object message)
        {
            var connections = GetConnectionsForUser(userId);
            foreach (var connectionId in connections)
            {
                await SendToConnection(connectionId, message);
            }
        }

        public async Task SendToDelivery(int deliveryId, object message)
        {
            var connections = GetConnectionsForDelivery(deliveryId);
            foreach (var connectionId in connections)
            {
                await SendToConnection(connectionId, message);
            }
        }

        public async Task SendToDrivers(object message)
        {
            // Get all driver user IDs
            var driverUserIds = _dbContext.Drivers
                .Select(d => d.UserId)
                .ToList();
            
            foreach (var userId in driverUserIds)
            {
                await SendToUser(userId, message);
            }
        }

        public async Task SendToAll(object message)
        {
            var wsMessage = new WebSocketMessage
            {
                Type = "broadcast",
                Data = message
            };
            
            var messageBytes = Encoding.UTF8.GetBytes(JsonSerializer.Serialize(wsMessage));
            var sendBuffer = new ArraySegment<byte>(messageBytes);
            
            var connectionsCopy = _connections.ToArray();
            foreach (var connection in connectionsCopy)
            {
                try
                {
                    if (connection.Value.State == WebSocketState.Open)
                    {
                        await connection.Value.SendAsync(
                            sendBuffer,
                            WebSocketMessageType.Text,
                            true,
                            CancellationToken.None);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, $"Error sending message to connection {connection.Key}");
                    await RemoveConnection(connection.Key);
                }
            }
        }

        public async Task SendToConnection(string connectionId, object message)
        {
            if (_connections.TryGetValue(connectionId, out var webSocket))
            {
                try
                {
                    if (webSocket.State == WebSocketState.Open)
                    {
                        var wsMessage = new WebSocketMessage
                        {
                            Type = message.GetType().Name.ToLower(),
                            Data = message
                        };
                        
                        var messageBytes = Encoding.UTF8.GetBytes(JsonSerializer.Serialize(wsMessage));
                        var sendBuffer = new ArraySegment<byte>(messageBytes);
                        
                        await webSocket.SendAsync(
                            sendBuffer,
                            WebSocketMessageType.Text,
                            true,
                            CancellationToken.None);
                    }
                    else
                    {
                        _logger.LogWarning($"WebSocket connection {connectionId} is not open");
                        await RemoveConnection(connectionId);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, $"Error sending message to connection {connectionId}");
                    await RemoveConnection(connectionId);
                }
            }
        }
    }
}