using FurnitureDelivery.API.Data;
using FurnitureDelivery.API.DTOs;
using FurnitureDelivery.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;

namespace FurnitureDelivery.API.Controllers
{
    [Route("api/furniture")]
    [ApiController]
    public class FurnitureController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public FurnitureController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/furniture
        [HttpGet]
        public async Task<ActionResult<IEnumerable<FurnitureDTO>>> GetFurniture([FromQuery] string category = null)
        {
            var query = _context.Furniture.AsQueryable();

            // Filter by category if provided
            if (!string.IsNullOrEmpty(category))
            {
                query = query.Where(f => f.Category == category);
            }

            var furniture = await query.ToListAsync();

            // Map to DTOs
            var furnitureDtos = furniture.Select(f => new FurnitureDTO
            {
                Id = f.Id,
                Name = f.Name,
                Description = f.Description,
                Weight = f.Weight,
                Dimensions = JsonSerializer.Deserialize<DimensionsDTO>(f.DimensionsJson),
                Category = f.Category,
                ImageUrl = f.ImageUrl
            }).ToList();

            return Ok(furnitureDtos);
        }

        // GET: api/furniture/5
        [HttpGet("{id}")]
        public async Task<ActionResult<FurnitureDTO>> GetFurniture(int id)
        {
            var furniture = await _context.Furniture.FindAsync(id);

            if (furniture == null)
            {
                return NotFound(new { message = "Furniture not found" });
            }

            var furnitureDto = new FurnitureDTO
            {
                Id = furniture.Id,
                Name = furniture.Name,
                Description = furniture.Description,
                Weight = furniture.Weight,
                Dimensions = JsonSerializer.Deserialize<DimensionsDTO>(furniture.DimensionsJson),
                Category = furniture.Category,
                ImageUrl = furniture.ImageUrl
            };

            return Ok(furnitureDto);
        }

        // POST: api/furniture
        [HttpPost]
        [Authorize(Roles = "admin")]
        public async Task<ActionResult<FurnitureDTO>> CreateFurniture(CreateFurnitureDTO createFurnitureDto)
        {
            // Convert dimensions to JSON
            string dimensionsJson = JsonSerializer.Serialize(createFurnitureDto.Dimensions);

            var furniture = new Furniture
            {
                Name = createFurnitureDto.Name,
                Description = createFurnitureDto.Description,
                Weight = createFurnitureDto.Weight,
                DimensionsJson = dimensionsJson,
                Category = createFurnitureDto.Category,
                ImageUrl = createFurnitureDto.ImageUrl
            };

            _context.Furniture.Add(furniture);
            await _context.SaveChangesAsync();

            var furnitureDto = new FurnitureDTO
            {
                Id = furniture.Id,
                Name = furniture.Name,
                Description = furniture.Description,
                Weight = furniture.Weight,
                Dimensions = createFurnitureDto.Dimensions,
                Category = furniture.Category,
                ImageUrl = furniture.ImageUrl
            };

            return CreatedAtAction(nameof(GetFurniture), new { id = furniture.Id }, furnitureDto);
        }

        // PUT: api/furniture/5
        [HttpPut("{id}")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> UpdateFurniture(int id, CreateFurnitureDTO updateFurnitureDto)
        {
            var furniture = await _context.Furniture.FindAsync(id);
            if (furniture == null)
            {
                return NotFound(new { message = "Furniture not found" });
            }

            // Convert dimensions to JSON
            string dimensionsJson = JsonSerializer.Serialize(updateFurnitureDto.Dimensions);

            // Update furniture properties
            furniture.Name = updateFurnitureDto.Name;
            furniture.Description = updateFurnitureDto.Description;
            furniture.Weight = updateFurnitureDto.Weight;
            furniture.DimensionsJson = dimensionsJson;
            furniture.Category = updateFurnitureDto.Category;
            furniture.ImageUrl = updateFurnitureDto.ImageUrl;

            await _context.SaveChangesAsync();

            return NoContent();
        }

        // DELETE: api/furniture/5
        [HttpDelete("{id}")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> DeleteFurniture(int id)
        {
            var furniture = await _context.Furniture.FindAsync(id);
            if (furniture == null)
            {
                return NotFound(new { message = "Furniture not found" });
            }

            // Check if furniture is used in any delivery
            bool isUsedInDelivery = await _context.DeliveryItems
                .AnyAsync(di => di.FurnitureId == id);

            if (isUsedInDelivery)
            {
                return BadRequest(new { message = "Cannot delete furniture that is used in deliveries" });
            }

            _context.Furniture.Remove(furniture);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // GET: api/furniture/categories
        [HttpGet("categories")]
        public async Task<ActionResult<IEnumerable<string>>> GetCategories()
        {
            var categories = await _context.Furniture
                .Select(f => f.Category)
                .Distinct()
                .ToListAsync();

            return Ok(categories);
        }
    }
}