using FurnitureDelivery.API.Models;
using System;

namespace FurnitureDelivery.API.Services
{
    public interface IAuthService
    {
        (string hash, string salt) HashPassword(string password);
        bool VerifyPassword(string password, string hash, string salt);
        string GenerateJwtToken(User user);
    }
}