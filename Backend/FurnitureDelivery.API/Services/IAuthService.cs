using FurnitureDelivery.API.Models;

namespace FurnitureDelivery.API.Services
{
    public interface IAuthService
    {
        /// <summary>
        /// Hashes a password with a random salt
        /// </summary>
        /// <param name="password">Plain text password</param>
        /// <returns>A tuple with (hash, salt)</returns>
        (string hash, string salt) HashPassword(string password);

        /// <summary>
        /// Verifies a password against a stored hash and salt
        /// </summary>
        /// <param name="password">Plain text password to verify</param>
        /// <param name="hash">Stored password hash</param>
        /// <param name="salt">Stored salt</param>
        /// <returns>True if the password matches, false otherwise</returns>
        bool VerifyPassword(string password, string hash, string salt);

        /// <summary>
        /// Generates a JWT token for authentication
        /// </summary>
        /// <param name="user">User to generate token for</param>
        /// <returns>JWT token string</returns>
        string GenerateJwtToken(User user);
    }
}