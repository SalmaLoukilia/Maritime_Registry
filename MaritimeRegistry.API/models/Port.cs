using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MaritimeRegistry.API.Models
{
    [Table("port")]
    public class Port
    {
        [Key]
        public int Port_Id { get; set; }

        [Required]
        [MaxLength(100)]
        public string Nom_Port { get; set; } = null!;

        [Required]
        [MaxLength(100)]
        public string Pays { get; set; } = null!;

        public ICollection<Navire> Navires { get; set; } = new HashSet<Navire>();
    }
}