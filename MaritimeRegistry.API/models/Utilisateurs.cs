using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace MaritimeRegistry.API.Models
{
    [Table("utilisateurs")]
    public class Utilisateurs
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        [Column("utilisateur_id")]
        [JsonPropertyName("utilisateur_id")]
        public int Utilisateur_Id { get; set; }

        [Required]
        [MaxLength(100)]
        [Column("nom_utilisateur")]
        [JsonPropertyName("nom_utilisateur")]
        public string Nom_Utilisateur { get; set; } = null!;

        [Required]
        [MaxLength(255)]
        [Column("mot_de_passe")]
        [JsonPropertyName("mot_de_passe")]
        public string Mot_De_Passe { get; set; } = null!;

        [Required]
        [MaxLength(50)]
        [Column("role")]
        [JsonPropertyName("role")]
        public string Role { get; set; } = null!;

        [Required]
        [MaxLength(255)]
        [Column("email")]
        [JsonPropertyName("email")]
        public string Email { get; set; } = null!;
    }
}