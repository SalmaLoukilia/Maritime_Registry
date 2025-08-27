using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using MaritimeRegistry.API.Data;
using MaritimeRegistry.API.Models;

namespace MaritimeRegistry.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ArmateursController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ILogger<ArmateursController> _logger;

        public ArmateursController(AppDbContext context, ILogger<ArmateursController> logger)
        {
            _context = context;
            _logger = logger;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetArmateurs()
        {
            try
            {
                _logger.LogInformation("Fetching all armateurs");
                
                var armateurs = await _context.Armateurs
                    .Select(a => new
                    {
                        Armateur_Id = a.Armateur_Id,
                        Nom_Armateur = a.Nom_Armateur,
                        Contact = a.Contact
                    })
                    .ToListAsync();
                
                _logger.LogInformation("Found {Count} armateurs", armateurs.Count);
                return Ok(armateurs);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching armateurs");
                return StatusCode(500, new { message = "An error occurred while fetching armateurs.", details = ex.Message });
            }
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<object>> GetArmateur(int id)
        {
            try
            {
                var armateur = await _context.Armateurs
                    .Where(a => a.Armateur_Id == id)
                    .Select(a => new
                    {
                        Armateur_Id = a.Armateur_Id,
                        Nom_Armateur = a.Nom_Armateur,
                        Contact = a.Contact
                    })
                    .FirstOrDefaultAsync();
                
                if (armateur == null)
                {
                    _logger.LogWarning("Armateur with ID {Id} not found", id);
                    return NotFound(new { message = $"Armateur with ID {id} not found." });
                }
                
                _logger.LogInformation("Fetched armateur with ID {Id}", id);
                return Ok(armateur);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching armateur with ID {Id}", id);
                return StatusCode(500, new { message = "An error occurred while fetching the armateur.", details = ex.Message });
            }
        }
        [HttpGet("{id}/ships")]
        public async Task<ActionResult<IEnumerable<object>>> GetArmateurShips(int id)
        {
            try
            {
                var armateurExists = await _context.Armateurs.AnyAsync(a => a.Armateur_Id == id);
                if (!armateurExists)
                {
                    _logger.LogWarning("Armateur with ID {Id} not found", id);
                    return NotFound(new { message = $"Armateur with ID {id} not found." });
                }

                var ships = await _context.Navires
                    .Where(n => n.Armateur_Id == id)
                    .Select(n => new
                    {
                        n.Imo,
                        n.Nom_Navire,
                        n.Type_Navire,
                        n.Statut
                    })
                    .ToListAsync();
                
                _logger.LogInformation("Fetched {Count} ships for armateur ID {Id}", ships.Count, id);
                return Ok(ships);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching ships for armateur with ID {Id}", id);
                return StatusCode(500, new { message = "An error occurred while fetching ships.", details = ex.Message });
            }
        }

        [HttpPost]
        public async Task<ActionResult<object>> CreateArmateur([FromBody] Armateur armateur)
        {
            if (!ModelState.IsValid)
            {
                _logger.LogWarning("Invalid model state for creating armateur: {Errors}", 
                    ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage));
                return BadRequest(ModelState);
            }

            try
            {
                var existingArmateur = await _context.Armateurs
                    .FirstOrDefaultAsync(a => a.Nom_Armateur == armateur.Nom_Armateur);
                
                if (existingArmateur != null)
                {
                    _logger.LogWarning("Armateur with name {Name} already exists", armateur.Nom_Armateur);
                    return Conflict(new { message = $"Armateur with name '{armateur.Nom_Armateur}' already exists." });
                }

                _context.Armateurs.Add(armateur);
                await _context.SaveChangesAsync();
                
                _logger.LogInformation("Created armateur with ID {Id}", armateur.Armateur_Id);
                
                return CreatedAtAction(nameof(GetArmateur), new { id = armateur.Armateur_Id }, new
                {
                    Armateur_Id = armateur.Armateur_Id,
                    Nom_Armateur = armateur.Nom_Armateur,
                    Contact = armateur.Contact
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating armateur");
                return StatusCode(500, new { message = "An error occurred while creating the armateur.", details = ex.Message });
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateArmateur(int id, [FromBody] Armateur armateur)
        {
            if (id != armateur.Armateur_Id)
            {
                _logger.LogWarning("ID mismatch for armateur update: {Id} vs {ArmateurId}", id, armateur.Armateur_Id);
                return BadRequest(new { message = "ID mismatch." });
            }

            if (!ModelState.IsValid)
            {
                _logger.LogWarning("Invalid model state for updating armateur with ID {Id}", id);
                return BadRequest(ModelState);
            }

            var existingArmateur = await _context.Armateurs.FindAsync(id);
            if (existingArmateur == null)
            {
                _logger.LogWarning("Armateur with ID {Id} not found for update", id);
                return NotFound(new { message = $"Armateur with ID {id} not found." });
            }

            try
            {
                var duplicateArmateur = await _context.Armateurs
                    .FirstOrDefaultAsync(a => a.Nom_Armateur == armateur.Nom_Armateur && a.Armateur_Id != id);
                
                if (duplicateArmateur != null)
                {
                    _logger.LogWarning("Armateur with name {Name} already exists", armateur.Nom_Armateur);
                    return Conflict(new { message = $"Armateur with name '{armateur.Nom_Armateur}' already exists." });
                }

                existingArmateur.Nom_Armateur = armateur.Nom_Armateur;
                existingArmateur.Contact = armateur.Contact;
                
                await _context.SaveChangesAsync();
                
                _logger.LogInformation("Updated armateur with ID {Id}", id);
                return NoContent();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!ArmateurExists(id))
                {
                    _logger.LogWarning("Armateur with ID {Id} not found during concurrency check", id);
                    return NotFound(new { message = $"Armateur with ID {id} not found." });
                }
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating armateur with ID {Id}", id);
                return StatusCode(500, new { message = "An error occurred while updating the armateur.", details = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteArmateur(int id)
        {
            var armateur = await _context.Armateurs.FindAsync(id);
            if (armateur == null)
            {
                _logger.LogWarning("Armateur with ID {Id} not found for deletion", id);
                return NotFound(new { message = $"Armateur with ID {id} not found." });
            }

            try
            {
                _context.Armateurs.Remove(armateur);
                await _context.SaveChangesAsync();
                _logger.LogInformation("Deleted armateur with ID {Id}", id);
                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting armateur with ID {Id}", id);
                return StatusCode(500, new { message = "An error occurred while deleting the armateur.", details = ex.Message });
            }
        }

        private bool ArmateurExists(int id)
        {
            return _context.Armateurs.Any(e => e.Armateur_Id == id);
        }
    }
}