using System.ComponentModel.DataAnnotations;

namespace MaritimeRegistry.API.Models
{
    public class Armateur
    {
        [Key]
        public int Armateur_Id { get; set; }

        [Required]
        [MaxLength(100)]
        public string Nom_Armateur { get; set; } = null!;

        [MaxLength(255)]
        public string Contact { get; set; } = null!;

        public ICollection<Navire> Navires { get; set; } = new HashSet<Navire>();
    }
}