using CountriesWebApp.Core.Interfaces;
using CountriesWebApp.Infrastructure.Services;
using CountriesWebApp.Infrastructure.Data;

namespace CountriesWebApp.Infrastructure.Data
{
    public class WebAppDbContext : DbContext
    {
        public WebAppDbContext(DbContextOptions<WebAppDbContext> options)
            : base(options)
        {
        }

        public DbSet<CountryStats> CountryData { get; set; }
    }
}