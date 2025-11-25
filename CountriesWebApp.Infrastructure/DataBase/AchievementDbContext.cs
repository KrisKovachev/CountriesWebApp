using Microsoft.EntityFrameworkCore;
using CountriesWebApp.Core.Models;

namespace CountriesWebApp.Infrastructure.DataBase;  
public class AchievementDbContext : DbContext
{
public AchievementDbContext(DbContextOptions<AchievementDbContext> options)
    : base(options)
{
}

public DbSet<Achievement> Achievements { get; set; }
public DbSet<UserAchievement> UserAchievements { get; set; }

protected override void OnModelCreating(ModelBuilder builder)
{
    base.OnModelCreating(builder);

    builder.Entity<UserAchievement>()
        .HasIndex(x => new { x.UserId, x.AchievementCode })
        .IsUnique();

    builder.Entity<Achievement>().HasData(
        new Achievement { Id = 1, Code = "FLAG_MASTER_1", Title = "Flag Master I", Description = "50 Points without loss.", Points = 50 },
        new Achievement { Id = 2, Code = "FLAG_MASTER_2", Title = "Flag Master II", Description = "80 Points without loss.", Points = 80 },
        new Achievement { Id = 3, Code = "FLAG_GOD", Title = "Flag God", Description = "100 Points without loss.", Points = 100 }
    );
}
}