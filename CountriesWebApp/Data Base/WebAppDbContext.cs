using Microsoft.EntityFrameworkCore;
using CountriesWebApp.Models;

namespace CountriesWebApp.Data_Base
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