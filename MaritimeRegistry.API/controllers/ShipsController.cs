using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MaritimeRegistry.API.Data;
using MaritimeRegistry.API.Models;
using System.Linq;
using System.Threading.Tasks;

namespace MaritimeRegistry.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ShipsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ShipsController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            try
            {
                var ships = await _context.Navires
                    .Include(n => n.Type_Navire)
                    .Include(n => n.Pavillon)
                    .Include(n => n.Armateur)
                    .Include(n => n.Port)
                    .ToListAsync();

                var result = ships.Select(n => new
                {
                    Imo = n.Imo,
                    Nom_Navire = n.Nom_Navire,
                    Type = n.Type_Navire != null ? n.Type_Navire.Type : n.Type_Navire_Id.ToString(),
                    Flag = n.Pavillon != null ? n.Pavillon.Pays : n.Pavillon_Id.ToString(),
                    Owner = n.Armateur != null ? n.Armateur.Nom_Armateur : n.Armateur_Id.ToString(),
                    Port = n.Port != null ? n.Port.Nom_Port : n.Port_Id.ToString(),
                    Statut = n.Statut,
                    Type_Navire_Id = n.Type_Navire_Id,
                    Pavillon_Id = n.Pavillon_Id,
                    Armateur_Id = n.Armateur_Id,
                    Port_Id = n.Port_Id
                }).ToList();

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error retrieving ships", error = ex.Message });
            }
        }

        [HttpGet("{imo:int}")]
        public async Task<IActionResult> Get(int imo)
        {
            try
            {
                var ship = await _context.Navires
                    .Include(n => n.Type_Navire)
                    .Include(n => n.Pavillon)
                    .Include(n => n.Armateur)
                    .Include(n => n.Port)
                    .FirstOrDefaultAsync(n => n.Imo == imo);

                if (ship == null)
                {
                    return NotFound(new { message = $"Ship with IMO {imo} not found." });
                }

                return Ok(new
                {
                    Imo = ship.Imo,
                    Nom_Navire = ship.Nom_Navire,
                    Type = ship.Type_Navire != null ? ship.Type_Navire.Type : ship.Type_Navire_Id.ToString(),
                    Flag = ship.Pavillon != null ? ship.Pavillon.Pays : ship.Pavillon_Id.ToString(),
                    Owner = ship.Armateur != null ? ship.Armateur.Nom_Armateur : ship.Armateur_Id.ToString(),
                    Port = ship.Port != null ? ship.Port.Nom_Port : ship.Port_Id.ToString(),
                    Statut = ship.Statut,
                    Type_Navire_Id = ship.Type_Navire_Id,
                    Pavillon_Id = ship.Pavillon_Id,
                    Armateur_Id = ship.Armateur_Id,
                    Port_Id = ship.Port_Id
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error retrieving ship", error = ex.Message });
            }
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] Navire ship)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                if (await _context.Navires.AnyAsync(n => n.Imo == ship.Imo))
                {
                    return Conflict(new { message = $"Ship with IMO {ship.Imo} already exists." });
                }

                if (!await _context.TypesNavire.AnyAsync(t => t.Type_Navire_Id == ship.Type_Navire_Id))
                {
                    return BadRequest(new { message = $"Invalid Type_Navire_Id {ship.Type_Navire_Id}." });
                }
                if (!await _context.Pavillons.AnyAsync(p => p.Pavillon_Id == ship.Pavillon_Id))
                {
                    return BadRequest(new { message = $"Invalid Pavillon_Id {ship.Pavillon_Id}." });
                }
                if (!await _context.Armateurs.AnyAsync(a => a.Armateur_Id == ship.Armateur_Id))
                {
                    return BadRequest(new { message = $"Invalid Armateur_Id {ship.Armateur_Id}." });
                }
                if (!await _context.Ports.AnyAsync(p => p.Port_Id == ship.Port_Id))
                {
                    return BadRequest(new { message = $"Invalid Port_Id {ship.Port_Id}." });
                }

                _context.Navires.Add(ship);
                await _context.SaveChangesAsync();
                
                return CreatedAtAction(nameof(Get), new { imo = ship.Imo }, new
                {
                    Imo = ship.Imo,
                    Nom_Navire = ship.Nom_Navire,
                    Type = ship.Type_Navire_Id.ToString(),
                    Flag = ship.Pavillon_Id.ToString(),
                    Owner = ship.Armateur_Id.ToString(),
                    Port = ship.Port_Id.ToString(),
                    Statut = ship.Statut,
                    Type_Navire_Id = ship.Type_Navire_Id,
                    Pavillon_Id = ship.Pavillon_Id,
                    Armateur_Id = ship.Armateur_Id,
                    Port_Id = ship.Port_Id
                });
            }
            catch (DbUpdateException ex)
            {
                return StatusCode(500, new { message = "Error creating ship. Please check the data and try again.", error = ex.InnerException?.Message ?? ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error creating ship", error = ex.Message });
            }
        }

        [HttpPut("{imo:int}")]
        public async Task<IActionResult> Update(int imo, [FromBody] Navire updatedShip)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                if (imo != updatedShip.Imo)
                {
                    return BadRequest(new { message = "IMO mismatch" });
                }

                var existingShip = await _context.Navires.FindAsync(imo);
                if (existingShip == null)
                {
                    return NotFound(new { message = $"Ship with IMO {imo} not found." });
                }

                if (!await _context.TypesNavire.AnyAsync(t => t.Type_Navire_Id == updatedShip.Type_Navire_Id))
                {
                    return BadRequest(new { message = $"Invalid Type_Navire_Id {updatedShip.Type_Navire_Id}." });
                }
                if (!await _context.Pavillons.AnyAsync(p => p.Pavillon_Id == updatedShip.Pavillon_Id))
                {
                    return BadRequest(new { message = $"Invalid Pavillon_Id {updatedShip.Pavillon_Id}." });
                }
                if (!await _context.Armateurs.AnyAsync(a => a.Armateur_Id == updatedShip.Armateur_Id))
                {
                    return BadRequest(new { message = $"Invalid Armateur_Id {updatedShip.Armateur_Id}." });
                }
                if (!await _context.Ports.AnyAsync(p => p.Port_Id == updatedShip.Port_Id))
                {
                    return BadRequest(new { message = $"Invalid Port_Id {updatedShip.Port_Id}." });
                }

                existingShip.Nom_Navire = updatedShip.Nom_Navire;
                existingShip.Statut = updatedShip.Statut;
                existingShip.Type_Navire_Id = updatedShip.Type_Navire_Id;
                existingShip.Pavillon_Id = updatedShip.Pavillon_Id;
                existingShip.Armateur_Id = updatedShip.Armateur_Id;
                existingShip.Port_Id = updatedShip.Port_Id;

                await _context.SaveChangesAsync();

                await _context.Entry(existingShip)
                    .Reference(n => n.Type_Navire).LoadAsync();
                await _context.Entry(existingShip)
                    .Reference(n => n.Pavillon).LoadAsync();
                await _context.Entry(existingShip)
                    .Reference(n => n.Armateur).LoadAsync();
                await _context.Entry(existingShip)
                    .Reference(n => n.Port).LoadAsync();

                return Ok(new
                {
                    Imo = existingShip.Imo,
                    Nom_Navire = existingShip.Nom_Navire,
                    Type = existingShip.Type_Navire?.Type,
                    Flag = existingShip.Pavillon?.Pays,
                    Owner = existingShip.Armateur?.Nom_Armateur,
                    Port = existingShip.Port?.Nom_Port,
                    Statut = existingShip.Statut,
                    Type_Navire_Id = existingShip.Type_Navire_Id,
                    Pavillon_Id = existingShip.Pavillon_Id,
                    Armateur_Id = existingShip.Armateur_Id,
                    Port_Id = existingShip.Port_Id
                });
            }
            catch (DbUpdateException ex)
            {
                return StatusCode(500, new { message = "Error updating ship. Please check the data and try again.", error = ex.InnerException?.Message ?? ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error updating ship", error = ex.Message });
            }
        }

        [HttpDelete("{imo:int}")]
        public async Task<IActionResult> Delete(int imo)
        {
            try
            {
                var ship = await _context.Navires
                    .Include(n => n.Certificats)
                    .Include(n => n.Inspections)
                    .Include(n => n.Mutations)
                    .Include(n => n.Immatriculations)
                    .Include(n => n.Radiations)
                    .FirstOrDefaultAsync(n => n.Imo == imo);
                    
                if (ship == null)
                {
                    return NotFound(new { message = $"Ship with IMO {imo} not found." });
                }

                if (ship.Certificats.Any() || ship.Inspections.Any() || ship.Mutations.Any() || 
                    ship.Immatriculations.Any() || ship.Radiations.Any())
                {
                    return BadRequest(new { message = "Cannot delete ship. It has related records (certificates, inspections, mutations, immatriculations, or radiations)." });
                }

                _context.Navires.Remove(ship);
                await _context.SaveChangesAsync();
                
                return NoContent();
            }
            catch (DbUpdateException ex)
            {
                return StatusCode(500, new { message = "Error deleting ship.", error = ex.InnerException?.Message ?? ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error deleting ship", error = ex.Message });
            }
        }

        [HttpGet("stats")]
        public async Task<IActionResult> GetStats()
        {
            try
            {
                var totalShips = await _context.Navires.CountAsync();
                var activeShips = await _context.Navires.CountAsync(n => n.Statut == "Active");
                var inactiveShips = await _context.Navires.CountAsync(n => n.Statut == "Inactive");
                var underRepairShips = await _context.Navires.CountAsync(n => n.Statut == "Under Repair");

                return Ok(new
                {
                    TotalShips = totalShips,
                    ActiveShips = activeShips,
                    InactiveShips = inactiveShips,
                    UnderRepairShips = underRepairShips
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error retrieving ship statistics", error = ex.Message });
            }
        }
    }
}