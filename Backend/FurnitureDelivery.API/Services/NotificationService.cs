using FurnitureDelivery.API.Data;
using FurnitureDelivery.API.Models;
using Microsoft.EntityFrameworkCore;
using System;
using System.Threading.Tasks;

namespace FurnitureDelivery.API.Services
{
    public class NotificationService : INotificationService
    {
        private readonly ApplicationDbContext _dbContext;
        private readonly IWebSocketService _webSocketService;

        public NotificationService(ApplicationDbContext dbContext, IWebSocketService webSocketService)
        {
            _dbContext = dbContext;
            _webSocketService = webSocketService;
        }

        public async Task<Notification> CreateNotification(
            int userId,
            string type,
            string title,
            string message,
            string relatedEntityType = null,
            int? relatedEntityId = null)
        {
            // Create the notification
            var notification = new Notification
            {
                UserId = userId,
                Type = type,
                Title = title,
                Message = message,
                IsRead = false,
                RelatedEntityType = relatedEntityType,
                RelatedEntityId = relatedEntityId,
                CreatedAt = DateTime.UtcNow
            };

            // Save notification to database
            _dbContext.Notifications.Add(notification);
            await _dbContext.SaveChangesAsync();

            // Send notification to user via WebSockets if they're connected
            try
            {
                await _webSocketService.SendToUser(userId, new
                {
                    type = "notification",
                    data = notification
                });
            }
            catch (Exception)
            {
                // If websocket send fails, we still continue
                // The notification is stored in the database and will be
                // available when the user queries for notifications
            }

            return notification;
        }

        public async Task MarkAsRead(int notificationId)
        {
            var notification = await _dbContext.Notifications.FindAsync(notificationId);
            
            if (notification != null)
            {
                notification.IsRead = true;
                await _dbContext.SaveChangesAsync();
            }
        }

        public async Task MarkAllAsRead(int userId)
        {
            var notifications = await _dbContext.Notifications
                .Where(n => n.UserId == userId && !n.IsRead)
                .ToListAsync();

            foreach (var notification in notifications)
            {
                notification.IsRead = true;
            }

            await _dbContext.SaveChangesAsync();
        }
    }
}