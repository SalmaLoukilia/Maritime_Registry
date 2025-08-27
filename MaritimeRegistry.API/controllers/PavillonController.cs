using MaritimeRegistry.API.Data;
using MaritimeRegistry.API.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace MaritimeRegistry.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PavillonController : ControllerBase
    {
        private readonly AppDbContext _context;

        public PavillonController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Pavillon>>> GetPavillons()
        {
            return await _context.Pavillons.ToListAsync();
        }

        [HttpPost]
        public async Task<ActionResult<Pavillon>> PostPavillon(Pavillon pavillon)
        {
            if (string.IsNullOrWhiteSpace(pavillon.Pays) || pavillon.Pays.Length > 100)
            {
                return BadRequest("Flag state must be non-empty and at most 100 characters.");
            }

            pavillon.Pays = pavillon.Pays.Trim().ToLower();

            // Check for existing pavillon
            var existingPavillon = await _context.Pavillons
                .FirstOrDefaultAsync(p => p.Pays.ToLower() == pavillon.Pays.ToLower());

            if (existingPavillon != null)
            {
                return Ok(existingPavillon);
            }

            _context.Pavillons.Add(pavillon);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetPavillon), new { id = pavillon.Pavillon_Id }, pavillon);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Pavillon>> GetPavillon(int id)
        {
            var pavillon = await _context.Pavillons.FindAsync(id);
            if (pavillon == null)
            {
                return NotFound();
            }
            return pavillon;
        }

        [HttpGet("byName/{name}")]
        public async Task<ActionResult<Pavillon>> GetPavillonByName(string name)
        {
            var pavillon = await _context.Pavillons
                .FirstOrDefaultAsync(p => p.Pays.ToLower() == name.ToLower());
            
            if (pavillon == null)
            {
                return NotFound();
            }
            return pavillon;
        }
    }
}