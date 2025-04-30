using FurnitureDelivery.API.Models;
using Microsoft.EntityFrameworkCore;
using System;

namespace FurnitureDelivery.API.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        public DbSet<User> Users { get; set; }
        public DbSet<Driver> Drivers { get; set; }
        public DbSet<Furniture> Furniture { get; set; }
        public DbSet<Delivery> Deliveries { get; set; }
        public DbSet<DeliveryItem> DeliveryItems { get; set; }
        public DbSet<Payment> Payments { get; set; }
        public DbSet<Message> Messages { get; set; }
        public DbSet<Review> Reviews { get; set; }
        public DbSet<Notification> Notifications { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configure relationships and constraints
            
            // User
            modelBuilder.Entity<User>()
                .HasIndex(u => u.Email)
                .IsUnique();
                
            // Driver
            modelBuilder.Entity<Driver>()
                .HasOne(d => d.User)
                .WithOne(u => u.Driver)
                .HasForeignKey<Driver>(d => d.UserId)
                .OnDelete(DeleteBehavior.Restrict);
                
            // Delivery
            modelBuilder.Entity<Delivery>()
                .HasOne(d => d.Customer)
                .WithMany()
                .HasForeignKey(d => d.CustomerId)
                .OnDelete(DeleteBehavior.Restrict);
                
            modelBuilder.Entity<Delivery>()
                .HasOne(d => d.Driver)
                .WithMany(d => d.Deliveries)
                .HasForeignKey(d => d.DriverId)
                .OnDelete(DeleteBehavior.Restrict);
                
            // DeliveryItem
            modelBuilder.Entity<DeliveryItem>()
                .HasOne(di => di.Delivery)
                .WithMany(d => d.Items)
                .HasForeignKey(di => di.DeliveryId)
                .OnDelete(DeleteBehavior.Cascade);
                
            modelBuilder.Entity<DeliveryItem>()
                .HasOne(di => di.Furniture)
                .WithMany(f => f.DeliveryItems)
                .HasForeignKey(di => di.FurnitureId)
                .OnDelete(DeleteBehavior.Restrict);
                
            // Payment
            modelBuilder.Entity<Payment>()
                .HasOne(p => p.Delivery)
                .WithOne(d => d.Payment)
                .HasForeignKey<Payment>(p => p.DeliveryId)
                .OnDelete(DeleteBehavior.Cascade);
                
            // Message
            modelBuilder.Entity<Message>()
                .HasOne(m => m.Delivery)
                .WithMany(d => d.Messages)
                .HasForeignKey(m => m.DeliveryId)
                .OnDelete(DeleteBehavior.Cascade);
                
            // Review
            modelBuilder.Entity<Review>()
                .HasOne(r => r.Delivery)
                .WithMany(d => d.Reviews)
                .HasForeignKey(r => r.DeliveryId)
                .OnDelete(DeleteBehavior.Cascade);
                
            modelBuilder.Entity<Review>()
                .HasOne(r => r.Customer)
                .WithMany()
                .HasForeignKey(r => r.CustomerId)
                .OnDelete(DeleteBehavior.Restrict);
                
            modelBuilder.Entity<Review>()
                .HasOne(r => r.Driver)
                .WithMany(d => d.Reviews)
                .HasForeignKey(r => r.DriverId)
                .OnDelete(DeleteBehavior.Restrict);
                
            // Notification
            modelBuilder.Entity<Notification>()
                .HasOne(n => n.User)
                .WithMany()
                .HasForeignKey(n => n.UserId)
                .OnDelete(DeleteBehavior.Cascade);
                
            // Seed data for development
            SeedData(modelBuilder);
        }

        private void SeedData(ModelBuilder modelBuilder)
        {
            // Only seed data in development environment
            if (Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") != "Development")
            {
                return;
            }

            // Seed Users
            modelBuilder.Entity<User>().HasData(
                new User
                {
                    Id = 1,
                    Email = "customer@example.com",
                    PasswordHash = "hashed_password_placeholder", // Would be properly hashed in real app
                    Salt = "salt_placeholder",
                    FirstName = "John",
                    LastName = "Customer",
                    PhoneNumber = "1234567890",
                    Address = "123 Main St, Anytown, USA",
                    CreatedAt = DateTime.UtcNow,
                    IsVerified = true,
                    UserType = "customer"
                },
                new User
                {
                    Id = 2,
                    Email = "driver@example.com",
                    PasswordHash = "hashed_password_placeholder", // Would be properly hashed in real app
                    Salt = "salt_placeholder",
                    FirstName = "Dave",
                    LastName = "Driver",
                    PhoneNumber = "0987654321",
                    Address = "456 Driver Rd, Anytown, USA",
                    CreatedAt = DateTime.UtcNow,
                    IsVerified = true,
                    UserType = "driver"
                }
            );

            // Seed Driver
            modelBuilder.Entity<Driver>().HasData(
                new Driver
                {
                    Id = 1,
                    UserId = 2,
                    VehicleType = "Truck",
                    LicensePlate = "ABC123",
                    Capacity = "Large",
                    IsAvailable = true,
                    CurrentLatitude = 34.0522,
                    CurrentLongitude = -118.2437,
                    Rating = 4.8,
                    VerificationStatus = "verified",
                    Documents = "{\"license\": \"verified\", \"insurance\": \"verified\"}"
                }
            );

            // Seed Furniture
            modelBuilder.Entity<Furniture>().HasData(
                new Furniture
                {
                    Id = 1,
                    Name = "Leather Sofa",
                    Description = "Premium leather 3-seater sofa",
                    Weight = 45.5,
                    DimensionsJson = "{\"length\": 200, \"width\": 85, \"height\": 70}",
                    Category = "Sofa",
                    ImageUrl = "/images/furniture/leather-sofa.jpg"
                },
                new Furniture
                {
                    Id = 2,
                    Name = "Queen Bed Frame",
                    Description = "Wooden queen size bed frame",
                    Weight = 35.0,
                    DimensionsJson = "{\"length\": 210, \"width\": 150, \"height\": 40}",
                    Category = "Bed",
                    ImageUrl = "/images/furniture/queen-bed.jpg"
                },
                new Furniture
                {
                    Id = 3,
                    Name = "Dining Table",
                    Description = "6-seater wooden dining table",
                    Weight = 30.0,
                    DimensionsJson = "{\"length\": 180, \"width\": 90, \"height\": 75}",
                    Category = "Table",
                    ImageUrl = "/images/furniture/dining-table.jpg"
                }
            );
        }
    }
}