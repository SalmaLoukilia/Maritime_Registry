using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MaritimeRegistry.API.Models
{
    public class Inspection
    {
        [Key]
        public int Inspection_Id { get; set; }

        [Required]
        public DateTime Date_Visite { get; set; }

        [MaxLength(100)]
        public string Resultat { get; set; } = null!;

        public string? Observations { get; set; }


        [Required]
        public int Imo { get; set; }

        [ForeignKey(nameof(Imo))]
        public Navire Navire { get; set; } = null!;
    }
}