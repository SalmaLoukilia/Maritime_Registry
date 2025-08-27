using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MaritimeRegistry.API.Models
{
    public class Certificat
    {
        [Key]
        public int Certificat_Id { get; set; }

        [Required]
        [MaxLength(100)]
        public string Type_Certif { get; set; } = null!;

        [Required]
        public DateTime Date_Delivrance { get; set; }

        [Required]
        public DateTime Date_Expiration { get; set; }

        [Required]
        public int Imo { get; set; }

        [ForeignKey(nameof(Imo))]
        public Navire Navire { get; set; } = null!;
    }
}