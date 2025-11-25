using CountriesWebApp.Core.Interfaces;
using CountriesWebApp.Core.Services;
using Microsoft.EntityFrameworkCore;
using CountriesWebApp.Core.Models;

namespace CountriesWebApp.Infrastructure.DataBase
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