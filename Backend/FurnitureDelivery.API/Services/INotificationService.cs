using FurnitureDelivery.API.Models;
using System.Threading.Tasks;

namespace FurnitureDelivery.API.Services
{
    public interface INotificationService
    {
        Task<Notification> CreateNotification(
            int userId, 
            string type, 
            string title, 
            string message, 
            string relatedEntityType = null, 
            int? relatedEntityId = null);
        
        Task MarkAsRead(int notificationId);
        
        Task MarkAllAsRead(int userId);
    }
}