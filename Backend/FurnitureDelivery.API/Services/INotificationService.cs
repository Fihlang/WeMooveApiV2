using FurnitureDelivery.API.Models;

namespace FurnitureDelivery.API.Services
{
    public interface INotificationService
    {
        /// <summary>
        /// Creates a new notification for a user
        /// </summary>
        /// <param name="userId">User ID to notify</param>
        /// <param name="type">Type of notification (info, warning, success, error)</param>
        /// <param name="title">Notification title</param>
        /// <param name="message">Notification message</param>
        /// <param name="relatedEntityType">Optional related entity type (e.g., "delivery", "driver")</param>
        /// <param name="relatedEntityId">Optional related entity ID</param>
        /// <returns>The created notification</returns>
        Task<Notification> CreateNotification(
            int userId,
            string type,
            string title,
            string message,
            string relatedEntityType = null,
            int? relatedEntityId = null);

        /// <summary>
        /// Marks a notification as read
        /// </summary>
        /// <param name="notificationId">ID of the notification to mark as read</param>
        Task MarkAsRead(int notificationId);

        /// <summary>
        /// Marks all notifications for a user as read
        /// </summary>
        /// <param name="userId">User ID whose notifications to mark as read</param>
        Task MarkAllAsRead(int userId);
    }
}