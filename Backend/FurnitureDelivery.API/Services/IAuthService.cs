using FurnitureDelivery.API.Models;

namespace FurnitureDelivery.API.Services
{
    public interface IAuthService
    {
        /// <summary>
        /// Generates a hash and salt for the given password
        /// </summary>
        /// <param name="password">The plaintext password to hash</param>
        /// <returns>Tuple containing the password hash and salt</returns>
        (byte[] passwordHash, byte[] passwordSalt) HashPassword(string password);
        
        /// <summary>
        /// Verifies if a given password matches the stored hash and salt
        /// </summary>
        /// <param name="password">The plaintext password to verify</param>
        /// <param name="passwordHash">The stored password hash</param>
        /// <param name="passwordSalt">The stored password salt</param>
        /// <returns>True if the password is valid, false otherwise</returns>
        bool VerifyPassword(string password, byte[] passwordHash, byte[] passwordSalt);
        
        /// <summary>
        /// Generates a JWT token for the given user
        /// </summary>
        /// <param name="user">The user to generate a token for</param>
        /// <returns>JWT token as string</returns>
        string GenerateJwtToken(User user);
        
        /// <summary>
        /// Validates a JWT token
        /// </summary>
        /// <param name="token">The token to validate</param>
        /// <returns>True if the token is valid, false otherwise</returns>
        bool ValidateToken(string token);
    }
}