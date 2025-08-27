// controllers/AuthController.cs
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MaritimeRegistry.API.Data;
using MaritimeRegistry.API.Models;

namespace MaritimeRegistry.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AuthController(AppDbContext context)
        {
            _context = context;
        }

        [HttpPost("login")]
        public async Task<ActionResult<LoginResponse>> Login([FromBody] LoginRequest request)
        {
            try
            {
                Console.WriteLine($"Tentative de connexion pour: {request.nom_utilisateur}");

                if (string.IsNullOrEmpty(request.nom_utilisateur) || string.IsNullOrEmpty(request.mot_de_passe))
                {
                    return BadRequest(new LoginResponse 
                    { 
                        success = false, 
                        message = "Nom d'utilisateur et mot de passe requis" 
                    });
                }

                // Rechercher l'utilisateur dans la base de données
                var user = await _context.Utilisateurs
                    .Where(u => u.Nom_Utilisateur == request.nom_utilisateur 
                           && u.Mot_De_Passe == request.mot_de_passe)
                    .Select(u => new { 
                        u.Utilisateur_Id, 
                        u.Nom_Utilisateur, 
                        u.Role, 
                        u.Email 
                    })
                    .FirstOrDefaultAsync();

                if (user == null)
                {
                    Console.WriteLine($"Utilisateur non trouvé: {request.nom_utilisateur}");
                    return Unauthorized(new LoginResponse 
                    { 
                        success = false, 
                        message = "Nom d'utilisateur ou mot de passe incorrect" 
                    });
                }

                // Générer un token simple
                var token = $"maritime_{DateTime.Now.Ticks}_{user.Utilisateur_Id}";

                Console.WriteLine($"Connexion réussie pour: {user.Nom_Utilisateur}, Role: {user.Role}");

                return Ok(new LoginResponse
                {
                    success = true,
                    token = token,
                    user = new UserInfo
                    {
                        utilisateur_id = user.Utilisateur_Id,
                        nom_utilisateur = user.Nom_Utilisateur,
                        role = user.Role,
                        email = user.Email
                    }
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Erreur lors de la connexion: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                
                return StatusCode(500, new LoginResponse 
                { 
                    success = false, 
                    message = "Erreur interne du serveur" 
                });
            }
        }

        // Endpoint pour tester la connexion à la base de données
        [HttpGet("test-db")]
        public async Task<ActionResult> TestDatabase()
        {
            try
            {
                var userCount = await _context.Utilisateurs.CountAsync();
                var users = await _context.Utilisateurs
                    .Select(u => new { u.Nom_Utilisateur, u.Role })
                    .ToListAsync();
                
                return Ok(new 
                { 
                    success = true, 
                    UserCount = userCount,
                    Users = users,
                    message = "Connexion à la base de données réussie" 
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new 
                { 
                    success = false, 
                    message = $"Erreur de base de données: {ex.Message}" 
                });
            }
        }

        [HttpGet("me")]
        public async Task<ActionResult<UserInfo>> GetCurrentUser([FromQuery] int utilisateur_id)
        {
            var user = await _context.Utilisateurs
                .Where(u => u.Utilisateur_Id == utilisateur_id)
                .Select(u => new UserInfo
                {
                    utilisateur_id = u.Utilisateur_Id,
                    nom_utilisateur = u.Nom_Utilisateur,
                    role = u.Role,
                    email = u.Email
                })
                .FirstOrDefaultAsync();

            if (user == null)
                return NotFound(new { success = false, message = "Utilisateur introuvable" });

            return Ok(user);
        }

    }

    // Modèles pour les requêtes/réponses
    public class LoginRequest
    {
        public string nom_utilisateur { get; set; } = string.Empty;
        public string mot_de_passe { get; set; } = string.Empty;
    }

    public class LoginResponse
    {
        public bool success { get; set; }
        public UserInfo? user { get; set; }
        public string? message { get; set; }
        public string? token { get; set; }
    }

    public class UserInfo
    {
        public int utilisateur_id { get; set; }
        public string nom_utilisateur { get; set; } = string.Empty;
        public string role { get; set; } = string.Empty;
        public string? email { get; set; }
    }
}