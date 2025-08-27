using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MaritimeRegistry.API.Models
{
    public class Mutation
    {
        [Key]
        public int Mutation_Id { get; set; }

        [Required]
        public DateTime Date_Demande { get; set; }

        [Required]
        [MaxLength(50)]
        public string Statut_Mutation { get; set; } = null!;

        [Required]
        public int Imo { get; set; }

        [ForeignKey(nameof(Imo))]
        public Navire Navire { get; set; } = null!;
    }
}