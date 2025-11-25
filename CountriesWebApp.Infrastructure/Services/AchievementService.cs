using CountriesWebApp.Core.Models;
using CountriesWebApp.Infrastructure.DataBase;
using Microsoft.EntityFrameworkCore;

namespace CountriesWebApp.Core.Services 
{
    public class AchievementService
    {
        private readonly AchievementDbContext _db;

        public AchievementService(AchievementDbContext db)
        {
            _db = db;
        }

        // 🔓 Отключване на achievement за даден user (userId = username)
        public async Task<bool> UnlockAsync(string userId, string code)
        {
            bool exists = await _db.UserAchievements
                .AnyAsync(x => x.UserId == userId && x.AchievementCode == code);

            if (exists)
                return false; // вече го има

            var ua = new UserAchievement
            {
                UserId = userId,
                AchievementCode = code,
                UnlockedAt = DateTime.UtcNow
            };

            _db.UserAchievements.Add(ua);
            await _db.SaveChangesAsync();

            return true; // ново unlock-ване
        }

        public Task<List<Achievement>> GetAllAsync()
            => _db.Achievements.ToListAsync();

        public Task<List<UserAchievement>> GetUserAchievementsAsync(string userId)
            => _db.UserAchievements
                .Where(x => x.UserId == userId)
                .ToListAsync();
    }
}