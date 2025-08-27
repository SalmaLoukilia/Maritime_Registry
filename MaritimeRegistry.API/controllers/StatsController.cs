using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MaritimeRegistry.API.Data;

namespace MaritimeRegistry.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class StatsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public StatsController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetDashboardStats()
        {
            try
            {
                var stats = new
                {
                    TotalUsers = await _context.Utilisateurs.CountAsync(),
                    TotalShips = await _context.Navires.CountAsync(),
                    TotalCertificates = await _context.Certificats.CountAsync(),
                    TotalInspections = await _context.Inspections.CountAsync(),
                    TotalOwners = await _context.Armateurs.CountAsync(),
                    ScheduledInspections = await _context.Inspections
                        .Where(i => i.Resultat == "Scheduled")
                        .CountAsync()
                };
                return Ok(stats);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = $"Error fetching stats: {ex.Message}" });
            }
        }
    }
}