using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MaritimeRegistry.API.Models
{
    public class Radiation
    {
        [Key]
        public int Radiation_Id { get; set; }

        [Required]
        [MaxLength(255)]
        public string Motif_Radiation { get; set; } = null!;

        [Required]
        public DateTime Date_Demande { get; set; }

        [Required]
        [MaxLength(50)]
        public string Statut_Radiation { get; set; } = null!;

        public DateTime? Date_Effective { get; set; } // Nullable car non requis dans la table

        [Required]
        public int Imo { get; set; }

        [ForeignKey(nameof(Imo))]
        public Navire Navire { get; set; } = null!;
    }
}