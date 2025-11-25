using Microsoft.EntityFrameworkCore;

namespace CountriesWebApp.Data
{
    public class UserDbContext : DbContext
    {
        public UserDbContext(DbContextOptions<UserDbContext> options) : base(options) { }

        // 👇 този конструктор е нужен за миграции
        public UserDbContext() { }

        public DbSet<Models.User> Users { get; set; }

        // 👇 това казва на EF как да се свърже, когато DI не е достъпен (при миграция)
        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            if (!optionsBuilder.IsConfigured)
            {
                optionsBuilder.UseSqlServer("Server=TEKANOS;Database=UserDb;Trusted_Connection=True;MultipleActiveResultSets=True;TrustServerCertificate=True;");
            }
        }
    }
}
