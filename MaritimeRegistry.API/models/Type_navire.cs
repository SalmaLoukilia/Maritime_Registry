using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MaritimeRegistry.API.Models
{
    [Table("type_navire")]
    public class Type_Navire
    {
        [Key]
        public int Type_Navire_Id { get; set; }

        [Required]
        [MaxLength(100)]
        public string Type { get; set; } = null!;

        public ICollection<Navire> Navires { get; set; } = new HashSet<Navire>();
    }
}