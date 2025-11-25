using CountriesWebApp.Core.Models;

namespace CountriesWebApp.Interfaces
{
    public interface IAchievementService
    {
        Task<bool> UnlockAsync(string userId, string code);
        Task<List<Achievement>> GetAllAsync();
        Task<List<UserAchievement>> GetUserAchievementsAsync(string userId);
    }
}
