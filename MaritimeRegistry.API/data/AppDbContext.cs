using Microsoft.EntityFrameworkCore;
using MaritimeRegistry.API.Models;

namespace MaritimeRegistry.API.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        public DbSet<Certificat> Certificats { get; set; } = null!;
        public DbSet<Inspection> Inspections { get; set; } = null!;
        public DbSet<Mutation> Mutations { get; set; } = null!;
        public DbSet<Armateur> Armateurs { get; set; } = null!;
        public DbSet<Radiation> Radiations { get; set; } = null!;
        public DbSet<Navire> Navires { get; set; } = null!;
        public DbSet<Port> Ports { get; set; } = null!;
        public DbSet<Immatriculation> Immatriculations { get; set; } = null!;
        public DbSet<Type_Navire> TypesNavire { get; set; } = null!;
        public DbSet<Pavillon> Pavillons { get; set; } = null!;
        public DbSet<Utilisateurs> Utilisateurs { get; set; } = null!;

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Navire>().ToTable("navires");
            modelBuilder.Entity<Armateur>().ToTable("armateur");
            modelBuilder.Entity<Port>().ToTable("port");
            modelBuilder.Entity<Pavillon>().ToTable("pavillon");
            modelBuilder.Entity<Type_Navire>().ToTable("type_navire");
            modelBuilder.Entity<Certificat>().ToTable("certificat");
            modelBuilder.Entity<Inspection>().ToTable("inspection");
            modelBuilder.Entity<Mutation>().ToTable("mutation");
            modelBuilder.Entity<Immatriculation>().ToTable("immatriculation");
            modelBuilder.Entity<Radiation>().ToTable("radiation");
            modelBuilder.Entity<Utilisateurs>().ToTable("utilisateurs");

modelBuilder.Entity<Utilisateurs>(entity =>
{
    entity.ToTable("utilisateurs");
    
    entity.HasKey(u => u.Utilisateur_Id);
    
    entity.Property(u => u.Utilisateur_Id)
        .HasColumnName("utilisateur_id")
        .ValueGeneratedOnAdd();
        
    entity.Property(u => u.Nom_Utilisateur)
        .HasColumnName("nom_utilisateur")
        .IsRequired()
        .HasMaxLength(100);
        
    entity.Property(u => u.Mot_De_Passe)
        .HasColumnName("mot_de_passe")
        .IsRequired()
        .HasMaxLength(255);
        
    entity.Property(u => u.Role)
        .HasColumnName("role")
        .IsRequired()
        .HasMaxLength(50);
        
    entity.Property(u => u.Email)
        .HasColumnName("email")
        .IsRequired()
        .HasMaxLength(255);
        
        
    entity.HasIndex(u => u.Nom_Utilisateur).IsUnique();
    entity.HasIndex(u => u.Email).IsUnique();
});

            modelBuilder.Entity<Navire>()
                .HasKey(n => n.Imo);
            modelBuilder.Entity<Navire>()
                .Property(n => n.Imo)
                .ValueGeneratedNever();
            modelBuilder.Entity<Navire>()
                .Property(n => n.Nom_Navire)
                .IsRequired()
                .HasMaxLength(100);
            modelBuilder.Entity<Navire>()
                .Property(n => n.Statut)
                .IsRequired()
                .HasMaxLength(50);

            modelBuilder.Entity<Armateur>()
                .HasKey(a => a.Armateur_Id);
            modelBuilder.Entity<Armateur>()
                .Property(a => a.Armateur_Id)
                .ValueGeneratedOnAdd();
            modelBuilder.Entity<Armateur>()
                .Property(a => a.Nom_Armateur)
                .IsRequired()
                .HasMaxLength(100);
            modelBuilder.Entity<Armateur>()
                .Property(a => a.Contact)
                .IsRequired()
                .HasMaxLength(255);

            modelBuilder.Entity<Port>()
                .HasKey(p => p.Port_Id);
            modelBuilder.Entity<Port>()
                .Property(p => p.Port_Id)
                .ValueGeneratedOnAdd();
            modelBuilder.Entity<Port>()
                .Property(p => p.Nom_Port)
                .IsRequired()
                .HasMaxLength(100);
            modelBuilder.Entity<Port>()
                .Property(p => p.Pays)
                .IsRequired()
                .HasMaxLength(100);
            modelBuilder.Entity<Port>()
                .HasIndex(p => new { p.Nom_Port, p.Pays })
                .IsUnique();

            modelBuilder.Entity<Pavillon>()
                .HasKey(p => p.Pavillon_Id);
            modelBuilder.Entity<Pavillon>()
                .Property(p => p.Pavillon_Id)
                .ValueGeneratedOnAdd();
            modelBuilder.Entity<Pavillon>()
                .Property(p => p.Pays)
                .IsRequired()
                .HasMaxLength(100);
            modelBuilder.Entity<Pavillon>()
                .HasIndex(p => p.Pays)
                .IsUnique();

            modelBuilder.Entity<Type_Navire>()
                .HasKey(t => t.Type_Navire_Id);
            modelBuilder.Entity<Type_Navire>()
                .Property(t => t.Type_Navire_Id)
                .ValueGeneratedOnAdd();
            modelBuilder.Entity<Type_Navire>()
                .Property(t => t.Type)
                .IsRequired()
                .HasMaxLength(100);
            modelBuilder.Entity<Type_Navire>()
                .HasIndex(t => t.Type)
                .IsUnique();
            modelBuilder.Entity<Certificat>()
                .HasKey(c => c.Certificat_Id);
            modelBuilder.Entity<Certificat>()
                .Property(c => c.Certificat_Id)
                .ValueGeneratedOnAdd();
            modelBuilder.Entity<Certificat>()
                .Property(c => c.Type_Certif)
                .IsRequired()
                .HasMaxLength(100);
            modelBuilder.Entity<Certificat>()
                .Property(c => c.Date_Delivrance)
                .IsRequired();
            modelBuilder.Entity<Certificat>()
                .Property(c => c.Date_Expiration)
                .IsRequired();

            modelBuilder.Entity<Inspection>()
                .HasKey(i => i.Inspection_Id);
            modelBuilder.Entity<Inspection>()
                .Property(i => i.Inspection_Id)
                .ValueGeneratedOnAdd();
            modelBuilder.Entity<Inspection>()
                .Property(i => i.Date_Visite)
                .IsRequired()
                .HasDefaultValueSql("CURRENT_TIMESTAMP");
            modelBuilder.Entity<Inspection>()
                .Property(i => i.Resultat)
                .IsRequired()
                .HasMaxLength(20);

            modelBuilder.Entity<Mutation>()
                .HasKey(m => m.Mutation_Id);
            modelBuilder.Entity<Mutation>()
                .Property(m => m.Mutation_Id)
                .ValueGeneratedOnAdd();
            modelBuilder.Entity<Mutation>()
                .Property(m => m.Date_Demande)
                .IsRequired()
                .HasDefaultValueSql("CURRENT_TIMESTAMP");

            modelBuilder.Entity<Immatriculation>()
                .HasKey(i => i.Immatriculation_Id);
            modelBuilder.Entity<Immatriculation>()
                .Property(i => i.Immatriculation_Id)
                .ValueGeneratedOnAdd();
            modelBuilder.Entity<Immatriculation>()
                .Property(i => i.Date_Demande)
                .IsRequired()
                .HasDefaultValueSql("CURRENT_TIMESTAMP");

            modelBuilder.Entity<Radiation>()
                .HasKey(r => r.Radiation_Id);
            modelBuilder.Entity<Radiation>()
                .Property(r => r.Radiation_Id)
                .ValueGeneratedOnAdd();
            modelBuilder.Entity<Radiation>()
                .Property(r => r.Statut_Radiation)
                .IsRequired()
                .HasMaxLength(50);

            modelBuilder.Entity<Navire>()
                .HasOne(n => n.Armateur)
                .WithMany(a => a.Navires)
                .HasForeignKey(n => n.Armateur_Id)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Navire>()
                .HasOne(n => n.Pavillon)
                .WithMany(p => p.Navires)
                .HasForeignKey(n => n.Pavillon_Id)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Navire>()
                .HasOne(n => n.Type_Navire)
                .WithMany(t => t.Navires)
                .HasForeignKey(n => n.Type_Navire_Id)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Navire>()
                .HasOne(n => n.Port)
                .WithMany(p => p.Navires)
                .HasForeignKey(n => n.Port_Id)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Certificat>()
                .HasOne(c => c.Navire)
                .WithMany(n => n.Certificats)
                .HasForeignKey(c => c.Imo)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Inspection>()
                .HasOne(i => i.Navire)
                .WithMany(n => n.Inspections)
                .HasForeignKey(i => i.Imo)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Immatriculation>()
                .HasOne(i => i.Navire)
                .WithMany(n => n.Immatriculations)
                .HasForeignKey(i => i.Imo)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Mutation>()
                .HasOne(m => m.Navire)
                .WithMany(n => n.Mutations)
                .HasForeignKey(m => m.Imo)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Radiation>()
                .HasOne(r => r.Navire)
                .WithMany(n => n.Radiations)
                .HasForeignKey(r => r.Imo)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}