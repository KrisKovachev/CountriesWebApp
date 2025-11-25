using System;

namespace CountriesWebApp.Core.Models
{
    public class UserAchievement
    {
        public int Id { get; set; }
        public string UserId { get; set; } = string.Empty;
        public string AchievementCode { get; set; } = string.Empty;
        public DateTime UnlockedAt { get; set; }
    }
}
