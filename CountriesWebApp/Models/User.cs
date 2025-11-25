using System.ComponentModel.DataAnnotations;

namespace CountriesWebApp.Models
{
    public class User
    {
        public int Id { get; set; }

        [Required, StringLength(50)]
        public string Username { get; set; } = string.Empty;

        [Required, EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        public string PasswordHash { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public int BestScore { get; set; } = 0;

        public string Rank { get; set; } = "Beginner";

        public static string CalculateRank(int score)
        {
            if (score >= 110) return "Ultimate Champion";
            if (score >= 90) return "Diamond";
            if (score >= 70) return "Platinum";
            if (score >= 50) return "Gold";
            if (score >= 40) return "Silver";
            if (score >= 30) return "Bronze";
            if (score >= 20) return "Wood";
            return "Beginner";
        }
        public int XP { get; set; } = 0;
        public int Level { get; set; } = 1;
        public int FlagQuizBestScore { get; set; } = 0;
        public string AvatarUrl { get; set; } = "/images/avatar/default-avatar.jpg";

    }
}
