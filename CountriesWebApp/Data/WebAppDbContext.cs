using CountriesWebApp.Interfaces;
using CountriesWebApp.Services;
using CountriesWebApp.Data;
using Microsoft.EntityFrameworkCore;
using CountriesWebApp.Models;

namespace CountriesWebApp.Data
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