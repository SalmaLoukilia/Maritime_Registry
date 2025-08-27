using MaritimeRegistry.API.Data;
using MaritimeRegistry.API.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace MaritimeRegistry.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PortController : ControllerBase
    {
        private readonly AppDbContext _context;

        public PortController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Port>>> GetPorts()
        {
            return await _context.Ports.ToListAsync();
        }

        [HttpPost]
        public async Task<ActionResult<Port>> PostPort(Port port)
        {
            if (string.IsNullOrWhiteSpace(port.Nom_Port) || port.Nom_Port.Length > 100)
            {
                return BadRequest("Port name must be non-empty and at most 100 characters.");
            }
            if (string.IsNullOrWhiteSpace(port.Pays) || port.Pays.Length > 100)
            {
                return BadRequest("Port country must be non-empty and at most 100 characters.");
            }

            port.Nom_Port = port.Nom_Port.Trim().ToLower();
            port.Pays = port.Pays.Trim().ToLower();

            // Check for existing port
            var existingPort = await _context.Ports
                .FirstOrDefaultAsync(p => p.Nom_Port.ToLower() == port.Nom_Port.ToLower() && 
                                        p.Pays.ToLower() == port.Pays.ToLower());

            if (existingPort != null)
            {
                return Ok(existingPort);
            }

            _context.Ports.Add(port);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetPort), new { id = port.Port_Id }, port);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Port>> GetPort(int id)
        {
            var port = await _context.Ports.FindAsync(id);
            if (port == null)
            {
                return NotFound();
            }
            return port;
        }
    }
}