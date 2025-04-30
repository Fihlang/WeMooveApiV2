using FurnitureDelivery.API.Data;
using FurnitureDelivery.API.DTOs;
using FurnitureDelivery.API.Models;
using Microsoft.EntityFrameworkCore;

namespace FurnitureDelivery.API.Services
{
    public class NotificationService : INotificationService
    {
        private readonly ApplicationDbContext _dbContext;
        private readonly IWebSocketService _webSocketService;

        public NotificationService(
            ApplicationDbContext dbContext,
            IWebSocketService webSocketService)
        {
            _dbContext = dbContext;
            _webSocketService = webSocketService;
        }

        public async Task<Notification> CreateNotification(
            int userId,
            string type,
            string title,
            string message,
            string? relatedEntityType = null,
            int? relatedEntityId = null)
        {
            // Check if user exists
            var user = await _dbContext.Users.FindAsync(userId);
            if (user == null)
            {
                throw new ArgumentException($"User with ID {userId} not found");
            }

            // Create notification
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

            _dbContext.Notifications.Add(notification);
            await _dbContext.SaveChangesAsync();

            // Send real-time notification via WebSocket
            await _webSocketService.SendToUser(userId, new WebSocketMessage
            {
                Type = "notification",
                Data = new NotificationDTO
                {
                    Id = notification.Id,
                    CreatedAt = notification.CreatedAt,
                    UserId = notification.UserId,
                    Type = notification.Type,
                    Title = notification.Title,
                    Message = notification.Message,
                    IsRead = notification.IsRead,
                    RelatedEntityType = notification.RelatedEntityType,
                    RelatedEntityId = notification.RelatedEntityId
                }
            });

            return notification;
        }

        public async Task<Notification> MarkNotificationAsRead(int notificationId)
        {
            var notification = await _dbContext.Notifications.FindAsync(notificationId);
            if (notification == null)
            {
                throw new ArgumentException($"Notification with ID {notificationId} not found");
            }

            notification.IsRead = true;
            await _dbContext.SaveChangesAsync();

            return notification;
        }

        public async Task<List<Notification>> GetNotificationsForUser(int userId)
        {
            return await _dbContext.Notifications
                .Where(n => n.UserId == userId)
                .OrderByDescending(n => n.CreatedAt)
                .ToListAsync();
        }

        public async Task<List<Notification>> GetUnreadNotificationsForUser(int userId)
        {
            return await _dbContext.Notifications
                .Where(n => n.UserId == userId && !n.IsRead)
                .OrderByDescending(n => n.CreatedAt)
                .ToListAsync();
        }
    }
}