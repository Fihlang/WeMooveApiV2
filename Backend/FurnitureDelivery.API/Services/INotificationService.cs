using FurnitureDelivery.API.Models;

namespace FurnitureDelivery.API.Services
{
    public interface INotificationService
    {
        /// <summary>
        /// Creates a new notification for a user
        /// </summary>
        /// <param name="userId">The ID of the user to receive the notification</param>
        /// <param name="type">The notification type (e.g., "info", "success", "warning", "error")</param>
        /// <param name="title">The notification title</param>
        /// <param name="message">The notification message</param>
        /// <param name="relatedEntityType">Optional. The type of related entity (e.g., "delivery", "driver")</param>
        /// <param name="relatedEntityId">Optional. The ID of the related entity</param>
        /// <returns>The created notification</returns>
        Task<Notification> CreateNotification(
            int userId,
            string type,
            string title,
            string message,
            string? relatedEntityType = null,
            int? relatedEntityId = null);
        
        /// <summary>
        /// Marks a notification as read
        /// </summary>
        /// <param name="notificationId">The notification ID</param>
        /// <returns>The updated notification</returns>
        Task<Notification> MarkNotificationAsRead(int notificationId);
        
        /// <summary>
        /// Gets all notifications for a user
        /// </summary>
        /// <param name="userId">The user ID</param>
        /// <returns>List of notifications</returns>
        Task<List<Notification>> GetNotificationsForUser(int userId);
        
        /// <summary>
        /// Gets unread notifications for a user
        /// </summary>
        /// <param name="userId">The user ID</param>
        /// <returns>List of unread notifications</returns>
        Task<List<Notification>> GetUnreadNotificationsForUser(int userId);
    }
}