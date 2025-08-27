using MaritimeRegistry.API.Data;
using MaritimeRegistry.API.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace MaritimeRegistry.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class TypeNavireController : ControllerBase
    {
        private readonly AppDbContext _context;

        public TypeNavireController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Type_Navire>>> GetShipTypes()
        {
            return await _context.TypesNavire.ToListAsync();
        }

        [HttpPost]
        public async Task<ActionResult<Type_Navire>> PostShipType(Type_Navire typeNavire)
        {
            if (string.IsNullOrWhiteSpace(typeNavire.Type) || typeNavire.Type.Length > 100)
            {
                return BadRequest("Ship type must be non-empty and at most 100 characters.");
            }

            typeNavire.Type = typeNavire.Type.Trim().ToLower();

            // Check for existing type
            var existingType = await _context.TypesNavire
                .FirstOrDefaultAsync(t => t.Type.ToLower() == typeNavire.Type.ToLower());

            if (existingType != null)
            {
                return Ok(existingType);
            }

            _context.TypesNavire.Add(typeNavire);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetShipType), new { id = typeNavire.Type_Navire_Id }, typeNavire);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Type_Navire>> GetShipType(int id)
        {
            var typeNavire = await _context.TypesNavire.FindAsync(id);
            if (typeNavire == null)
            {
                return NotFound();
            }
            return typeNavire;
        }

        [HttpGet("byName/{name}")]
        public async Task<ActionResult<Type_Navire>> GetShipTypeByName(string name)
        {
            var typeNavire = await _context.TypesNavire
                .FirstOrDefaultAsync(t => t.Type.ToLower() == name.ToLower());
            
            if (typeNavire == null)
            {
                return NotFound();
            }
            return typeNavire;
        }
    }
}