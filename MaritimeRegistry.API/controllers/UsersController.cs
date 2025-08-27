using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MaritimeRegistry.API.Data;
using MaritimeRegistry.API.Models;
using System.Linq;
using System.Threading.Tasks;
using System;

namespace MaritimeRegistry.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UsersController : ControllerBase
    {
        private readonly AppDbContext _context;

        public UsersController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            try
            {
                Console.WriteLine("Fetching users from database...");

                var users = await _context.Utilisateurs
                    .Select(u => new
                    {
                        utilisateur_id = u.Utilisateur_Id,
                        nom_utilisateur = u.Nom_Utilisateur,
                        email = u.Email,
                        role = u.Role
                    })
                    .ToListAsync();

                Console.WriteLine($"Number of users found: {users.Count}");

                return Ok(users);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error fetching users: {ex.Message}");
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> Get(int id)
        {
            try
            {
                var user = await _context.Utilisateurs
                    .Where(u => u.Utilisateur_Id == id)
                    .Select(u => new
                    {
                        utilisateur_id = u.Utilisateur_Id,
                        nom_utilisateur = u.Nom_Utilisateur,
                        email = u.Email,
                        role = u.Role
                    })
                    .FirstOrDefaultAsync();

                if (user == null)
                {
                    return NotFound(new { message = $"User with ID {id} not found." });
                }

                return Ok(user);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] UserCreateRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                // Check for duplicates
                if (await _context.Utilisateurs.AnyAsync(u => u.Nom_Utilisateur == request.nom_utilisateur))
                {
                    return Conflict(new { message = $"Username {request.nom_utilisateur} already exists." });
                }
                if (await _context.Utilisateurs.AnyAsync(u => u.Email == request.email))
                {
                    return Conflict(new { message = $"Email {request.email} already exists." });
                }

                // Validate Role
                if (string.IsNullOrEmpty(request.role) || !new[] { "Admin", "Agent", "Armateur" }.Contains(request.role))
                {
                    return BadRequest(new { message = "Invalid role. Allowed roles: Admin, Agent, Armateur." });
                }

                var user = new Utilisateurs
                {
                    Nom_Utilisateur = request.nom_utilisateur,
                    Email = request.email,
                    Role = request.role,
                    Mot_De_Passe = request.mot_de_passe // Should be hashed in production
                };

                _context.Utilisateurs.Add(user);
                await _context.SaveChangesAsync();

                return CreatedAtAction(nameof(Get), new { id = user.Utilisateur_Id }, new
                {
                    utilisateur_id = user.Utilisateur_Id,
                    nom_utilisateur = user.Nom_Utilisateur,
                    email = user.Email,
                    role = user.Role
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error creating user", error = ex.Message });
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] UserUpdateRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                var user = await _context.Utilisateurs.FindAsync(id);
                if (user == null)
                {
                    return NotFound(new { message = $"User with ID {id} not found." });
                }

                // Check for duplicates (excluding current user)
                if (await _context.Utilisateurs.AnyAsync(u => u.Nom_Utilisateur == request.nom_utilisateur && u.Utilisateur_Id != id))
                {
                    return Conflict(new { message = $"Username {request.nom_utilisateur} already exists." });
                }
                if (await _context.Utilisateurs.AnyAsync(u => u.Email == request.email && u.Utilisateur_Id != id))
                {
                    return Conflict(new { message = $"Email {request.email} already exists." });
                }

                user.Nom_Utilisateur = request.nom_utilisateur;
                user.Email = request.email;
                user.Role = request.role;

                if (!string.IsNullOrEmpty(request.mot_de_passe))
                {
                    user.Mot_De_Passe = request.mot_de_passe; // Should be hashed
                }

                await _context.SaveChangesAsync();

                return Ok(new
                {
                    utilisateur_id = user.Utilisateur_Id,
                    nom_utilisateur = user.Nom_Utilisateur,
                    email = user.Email,
                    role = user.Role
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error updating user", error = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            try
            {
                var user = await _context.Utilisateurs.FindAsync(id);
                if (user == null)
                {
                    return NotFound(new { message = $"User with ID {id} not found." });
                }

                _context.Utilisateurs.Remove(user);
                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error deleting user", error = ex.Message });
            }
        }
    }

    // Request models for better validation
    public class UserCreateRequest
    {
        public string nom_utilisateur { get; set; } = string.Empty;
        public string email { get; set; } = string.Empty;
        public string role { get; set; } = string.Empty;
        public string mot_de_passe { get; set; } = string.Empty;
    }

    public class UserUpdateRequest
    {
        public string nom_utilisateur { get; set; } = string.Empty;
        public string email { get; set; } = string.Empty;
        public string role { get; set; } = string.Empty;
        public string? mot_de_passe { get; set; }
    }
    

    
}