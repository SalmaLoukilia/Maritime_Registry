using MaritimeRegistry.API.Data;
using MaritimeRegistry.API.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace MaritimeRegistry.API.Controllers
{
    [Route("api/[controller]")]
    // Contrôleur API pour les certificats
    [ApiController]
    [Route("api/[controller]")]
    public class CertificateController : ControllerBase
    {
        private readonly AppDbContext _context;

        public CertificateController(AppDbContext context)
        {
            _context = context;
        }

        [HttpPost("request")]
        public async Task<IActionResult> RequestCertificate([FromBody] CertificateRequestDto request)
        {
            try
            {
                // 1. Vérifier que le navire existe
                var navire = await _context.Navires
                    .Include(n => n.Armateur)
                    .FirstOrDefaultAsync(n => n.Imo == request.Imo);

                if (navire == null)
                {
                    return NotFound(new { message = "Navire non trouvé." });
                }

                // 2. Vérifier que l'email correspond au propriétaire
                if (navire.Armateur?.Contact != request.OwnerEmail)
                {
                    return BadRequest(new { message = "L'email ne correspond pas au propriétaire du navire." });
                }

                // 3. Vérifier que le type de certificat est valide
                var certificatType = GetCertificatTypeName(request.Type_Certif_Id);
                if (string.IsNullOrEmpty(certificatType))
                {
                    return BadRequest(new { message = "Type de certificat invalide." });
                }

                // 4. Vérifier les conditions préalables (statut du navire, inspections, etc.)
                if (navire.Statut != "Actif")
                {
                    return BadRequest(new { message = "Le navire doit être actif pour demander un certificat." });
                }

                // 5. Calculer les dates de délivrance et d'expiration
                var dateDelivrance = DateTime.Now;
                var dateExpiration = dateDelivrance.AddYears(1); // Valide 1 an

                // 6. Créer le certificat
                var certificat = new Certificat
                {
                    Type_Certif = certificatType,
                    Date_Delivrance = dateDelivrance,
                    Date_Expiration = dateExpiration,
                    Imo = request.Imo
                };

                _context.Certificats.Add(certificat);
                await _context.SaveChangesAsync();

                // 7. Retourner la réponse
                return Ok(new
                {
                    message = "Certificat créé avec succès",
                    certificat_id = certificat.Certificat_Id,
                    type_certif = certificat.Type_Certif,
                    date_delivrance = certificat.Date_Delivrance,
                    date_expiration = certificat.Date_Expiration,
                    imo = certificat.Imo
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Erreur interne du serveur", error = ex.Message });
            }
        }

        private string GetCertificatTypeName(int typeId)
        {
            return typeId switch
            {
                1 => "Load Line Certificate",
                2 => "Passenger Ship Safety Certificate",
                3 => "Safety Equipment Certificate",
                4 => "International Pollution Prevention Certificate (MARPOL)",
                5 => "Safety Radio Certificate",
                6 => "International Tonnage Certificate",
                7 => "Safety Management Certificate (ISM Code)",
                8 => "Maritime Labour Certificate (MLC)",
                _ => null
            };
        }
    }

    // DTO pour la demande de certificat
    public class CertificateRequestDto
    {
        public int Imo { get; set; }
        public string OwnerEmail { get; set; }
        public int Type_Certif_Id { get; set; }
    }
}