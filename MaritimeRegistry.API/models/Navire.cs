using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using MaritimeRegistry.API.Models; 

namespace MaritimeRegistry.API.Models
{
    public class Navire
    {
        [Key]
        public int Imo { get; set; }

        [Required]
        [Column("nom_navire")]
        [MaxLength(100)]
        public string Nom_Navire { get; set; } = null!;

        [Required]
        [MaxLength(50)]
        public string Statut { get; set; } = null!;

        [ForeignKey("Type_Navire")]
        public int Type_Navire_Id { get; set; }

        [ForeignKey("Pavillon")]
        public int Pavillon_Id { get; set; }

        [ForeignKey("Port")]
        public int Port_Id { get; set; }

        [ForeignKey("Armateur")]
        public int Armateur_Id { get; set; }

        public Type_Navire? Type_Navire { get; set; }
        public Pavillon? Pavillon { get; set; }
        public Port? Port { get; set; }
        public Armateur? Armateur { get; set; }

        public ICollection<Certificat> Certificats { get; set; } = new HashSet<Certificat>();
        public ICollection<Inspection> Inspections { get; set; } = new HashSet<Inspection>();
        public ICollection<Mutation> Mutations { get; set; } = new HashSet<Mutation>();
        public ICollection<Immatriculation> Immatriculations { get; set; } = new HashSet<Immatriculation>();
        public ICollection<Radiation> Radiations { get; set; } = new HashSet<Radiation>();
    }
}