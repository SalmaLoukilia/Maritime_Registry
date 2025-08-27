using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MaritimeRegistry.API.Models
{
    [Table("pavillon")]
    public class Pavillon
    {
        [Key]
        public int Pavillon_Id { get; set; }

        [Required]
        [MaxLength(100)]
        public string Pays { get; set; } = null!;

        public ICollection<Navire> Navires { get; set; } = new HashSet<Navire>();
    }
}