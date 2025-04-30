using FurnitureDelivery.API.Data;
using FurnitureDelivery.API.DTOs;
using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json;
using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Net.WebSockets;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace FurnitureDelivery.API.Services
{
    public class WebSocketService : IWebSocketService
    {
        private readonly ConcurrentDictionary<string, WebSocket> _connections = new ConcurrentDictionary<string, WebSocket>();
        private readonly ConcurrentDictionary<int, List<string>> _userConnections = new ConcurrentDictionary<int, List<string>>();
        private readonly ConcurrentDictionary<int, List<string>> _deliveryConnections = new ConcurrentDictionary<int, List<string>>();
        private readonly ConcurrentDictionary<int, List<string>> _driverConnections = new ConcurrentDictionary<int, List<string>>();
        private readonly List<string> _driverBroadcastConnections = new List<string>();
        private readonly ApplicationDbContext _dbContext;

        public WebSocketService(ApplicationDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        public void AddConnection(int userId, string connectionId)
        {
            var userConnectionList = _userConnections.GetOrAdd(userId, new List<string>());
            lock (userConnectionList)
            {
                if (!userConnectionList.Contains(connectionId))
                {
                    userConnectionList.Add(connectionId);
                }
            }

            // If user is a driver, also add to driver connections
            var driver = _dbContext.Drivers.FirstOrDefault(d => d.UserId == userId);
            if (driver != null)
            {
                var driverConnectionList = _driverConnections.GetOrAdd(driver.Id, new List<string>());
                lock (driverConnectionList)
                {
                    if (!driverConnectionList.Contains(connectionId))
                    {
                        driverConnectionList.Add(connectionId);
                    }
                }

                lock (_driverBroadcastConnections)
                {
                    if (!_driverBroadcastConnections.Contains(connectionId))
                    {
                        _driverBroadcastConnections.Add(connectionId);
                    }
                }
            }
        }

        public void RemoveConnection(string connectionId)
        {
            _connections.TryRemove(connectionId, out _);

            // Remove from user connections
            foreach (var userId in _userConnections.Keys)
            {
                var userConnectionList = _userConnections[userId];
                lock (userConnectionList)
                {
                    userConnectionList.Remove(connectionId);
                }
            }

            // Remove from delivery connections
            foreach (var deliveryId in _deliveryConnections.Keys)
            {
                var deliveryConnectionList = _deliveryConnections[deliveryId];
                lock (deliveryConnectionList)
                {
                    deliveryConnectionList.Remove(connectionId);
                }
            }

            // Remove from driver connections
            foreach (var driverId in _driverConnections.Keys)
            {
                var driverConnectionList = _driverConnections[driverId];
                lock (driverConnectionList)
                {
                    driverConnectionList.Remove(connectionId);
                }
            }

            // Remove from driver broadcast connections
            lock (_driverBroadcastConnections)
            {
                _driverBroadcastConnections.Remove(connectionId);
            }
        }

        public List<string> GetConnectionsForUser(int userId)
        {
            return _userConnections.GetValueOrDefault(userId, new List<string>());
        }

        public async Task SendToUser(int userId, object message)
        {
            var connections = GetConnectionsForUser(userId);
            await SendToConnectionList(connections, message);
        }

        public async Task SendToDelivery(int deliveryId, object message)
        {
            var delivery = await _dbContext.Deliveries
                .Include(d => d.Customer)
                .Include(d => d.Driver)
                .FirstOrDefaultAsync(d => d.Id == deliveryId);

            if (delivery == null)
                return;

            // Send to customer
            await SendToUser(delivery.CustomerId, message);

            // Send to driver if assigned
            if (delivery.DriverId.HasValue)
            {
                var driver = await _dbContext.Drivers.FindAsync(delivery.DriverId.Value);
                if (driver != null)
                {
                    await SendToUser(driver.UserId, message);
                }
            }
        }

        public async Task SendToDriver(int driverId, object message)
        {
            var driver = await _dbContext.Drivers.FindAsync(driverId);
            if (driver != null)
            {
                await SendToUser(driver.UserId, message);
            }
        }

        public async Task BroadcastToDrivers(object message)
        {
            List<string> connections;
            lock (_driverBroadcastConnections)
            {
                connections = _driverBroadcastConnections.ToList();
            }
            await SendToConnectionList(connections, message);
        }

        public async Task BroadcastLocationUpdate(int driverId, double latitude, double longitude)
        {
            var driver = await _dbContext.Drivers
                .Include(d => d.User)
                .FirstOrDefaultAsync(d => d.Id == driverId);

            if (driver == null)
                return;

            // Update driver location in database
            driver.CurrentLatitude = latitude;
            driver.CurrentLongitude = longitude;
            await _dbContext.SaveChangesAsync();

            // Get active deliveries for this driver
            var activeDeliveries = await _dbContext.Deliveries
                .Where(d => d.DriverId == driverId && 
                            (d.Status == "assigned" || d.Status == "in_transit"))
                .ToListAsync();

            // Create location update message
            var locationUpdate = new DriverLocationUpdate
            {
                DriverId = driverId,
                Location = new GeoLocation
                {
                    Latitude = latitude,
                    Longitude = longitude
                }
            };

            // For each active delivery, notify the customer
            foreach (var delivery in activeDeliveries)
            {
                await SendToUser(delivery.CustomerId, new WebSocketMessage
                {
                    Type = "driver_location",
                    Data = locationUpdate
                });
            }
        }

        public async Task BroadcastDeliveryStatusUpdate(int deliveryId, string status)
        {
            var delivery = await _dbContext.Deliveries.FindAsync(deliveryId);
            if (delivery == null)
                return;

            // Update delivery status in database
            delivery.Status = status;
            delivery.UpdatedAt = DateTime.UtcNow;
            await _dbContext.SaveChangesAsync();

            // Create status update message
            var statusUpdate = new DeliveryStatusUpdate
            {
                DeliveryId = deliveryId,
                Status = status
            };

            // Send status update to all parties involved
            await SendToDelivery(deliveryId, new WebSocketMessage
            {
                Type = "delivery_status",
                Data = statusUpdate
            });
        }

        private async Task SendToConnectionList(List<string> connectionIds, object message)
        {
            var serializedMessage = JsonConvert.SerializeObject(message);
            var messageBytes = Encoding.UTF8.GetBytes(serializedMessage);

            List<Task> tasks = new List<Task>();

            foreach (var connectionId in connectionIds)
            {
                if (_connections.TryGetValue(connectionId, out WebSocket socket) && 
                    socket.State == WebSocketState.Open)
                {
                    var segment = new ArraySegment<byte>(messageBytes);
                    tasks.Add(socket.SendAsync(segment, WebSocketMessageType.Text, true, CancellationToken.None));
                }
            }

            await Task.WhenAll(tasks);
        }
    }
}