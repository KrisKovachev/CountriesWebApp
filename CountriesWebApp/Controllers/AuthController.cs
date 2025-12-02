using CountriesWebApp.Infrastructure.DataBase;
using CountriesWebApp.Core.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;
using System.Text;

namespace CountriesWebApp.Controllers
{
    public class AuthController : Controller
    {
        private readonly UserDbContext _context;
        private readonly IWebHostEnvironment env;

        public AuthController(UserDbContext context,IWebHostEnvironment env)
        {
            _context = context;
            this.env = env;
            Path.Combine(env.WebRootPath, "/images/avatar/1234.jpg");
        }

        [HttpGet]
        public IActionResult Register() => View();

        //ПРОФИЛНА СНИМКА
        [HttpPost]
        public async Task<IActionResult> UploadProfilePicture(IFormFile profileImage)
        {
            if (profileImage == null || profileImage.Length == 0)
            {
                TempData["Error"] = "Please select a file.";
                return RedirectToAction("Profile");
            }

            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif" };
            var extension = Path.GetExtension(profileImage.FileName).ToLower();

            if (!allowedExtensions.Contains(extension))
            {
                TempData["Error"] = "Invalid image format. Allowed: JPG, PNG, GIF.";
                return RedirectToAction("Profile");
            }

            var username = HttpContext.Session.GetString("Username");
            if (username == null)
                return RedirectToAction("Login");

            var user = _context.Users.FirstOrDefault(x => x.Username == username);
            if (user == null)
                return RedirectToAction("Login");

            // === 1) ТРИЕМ СТАРИЯ АВАТАР АКО НЕ Е DEFAULT ===
            if (!string.IsNullOrEmpty(user.AvatarUrl) && user.AvatarUrl.Contains("avatar"))
            {
                var oldFileName = user.AvatarUrl.Split("?")[0]; // махаме ?t= версии
                var oldFilePath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", oldFileName.TrimStart('/'));

                if (System.IO.File.Exists(oldFilePath))
                    System.IO.File.Delete(oldFilePath);
            }

            // === 2) СЪЗДАВАМЕ УНИКАЛНО ИМЕ === 
            var fileName = $"{Guid.NewGuid()}{extension}";
            var uploadPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot/images/avatar");
            var filePath = Path.Combine(uploadPath, fileName);

            Directory.CreateDirectory(uploadPath);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await profileImage.CopyToAsync(stream);
            }

            // === 3) ОБНОВЯВАМЕ БАЗАТА С НОВИЯ АВАТАР ===
            user.AvatarUrl = "/images/avatar/" + fileName;
            _context.SaveChanges();

            TempData["Success"] = "Profile picture updated!";
            return RedirectToAction("Profile");
        }



        [HttpPost]
        public async Task<IActionResult> Register(string username, string email, string password)
        {
            if (await _context.Users.AnyAsync(u => u.Username == username))
            {
                ViewBag.Error = "Username already taken.";
                return View();
            }

            var hashed = HashPassword(password);

            var user = new User
            {
                Username = username,
                Email = email,
                PasswordHash = hashed,
                XP = 0,
                Level = 1,
                Rank = "Beginner",
                AvatarUrl = "/images/avatar/default-avatar.jpg"
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            HttpContext.Session.SetString("Username", username);
            return RedirectToAction("Index", "Home");
        }

        [HttpGet]
        public IActionResult Login() => View();

        [HttpPost]
        public async Task<IActionResult> Login(string username, string password)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Username == username);
            if (user == null || !VerifyPassword(password, user.PasswordHash))
            {
                ViewBag.Error = "Invalid username or password.";
                return View();
            }

            HttpContext.Session.SetString("Username", user.Username);
            return RedirectToAction("Index", "Home");
        }

        [HttpPost]
        public async Task<IActionResult> UpdateScore(int score)
        {
            var username = HttpContext.Session.GetString("Username");
            if (string.IsNullOrEmpty(username))
                return Unauthorized();

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Username == username);
            if (user == null)
                return NotFound();

            if (score > user.BestScore)
            {
                user.BestScore = score;
                user.Rank = GetRank(score);
            }

            await _context.SaveChangesAsync();
            return Ok(); 
        }


        [HttpPost]
        public async Task<IActionResult> UpdateXP(int xpGained)
        {
            var username = HttpContext.Session.GetString("Username");
            if (string.IsNullOrEmpty(username)) return Unauthorized();

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Username == username);
            if (user == null) return NotFound();

            bool leveledUp = false;

            user.XP += xpGained;

            while (user.XP >= RequiredXPForNextLevel(user.Level))
            {
                user.XP -= RequiredXPForNextLevel(user.Level);
                user.Level++;
                leveledUp = true;
            }

            await _context.SaveChangesAsync();

            return Ok(new
            {
                level = user.Level,
                xp = user.XP,
                needed = RequiredXPForNextLevel(user.Level),
                isLevelUp = leveledUp
            });
        }

        [HttpPost]
        public async Task<IActionResult> UpdateFlagQuizScore(int score)
        {
            var username = HttpContext.Session.GetString("Username");
            if (username == null)
                return Json(new { error = true });

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Username == username);
            if (user == null)
                return Json(new { error = true });

            if (score > user.FlagQuizBestScore)
                user.FlagQuizBestScore = score;

            await _context.SaveChangesAsync();

            return Json(new { success = true });
        }

        [HttpGet]
        public async Task<IActionResult> FlagQuizLeaderboard()
        {
            // 1) Вземаме чистите данни директно от базата (без методи вътре в Select!)
            var raw = await _context.Users
                .OrderByDescending(u => u.FlagQuizBestScore)
                .Take(50)
                .ToListAsync();

            // 2) Правим конверсията в C# (EF вече не участва — всичко е позволено)
            var list = raw.Select(u => new {
                username = u.Username,
                bestScore = u.FlagQuizBestScore,
                badgeImage = GetBadgeForLevel(u.Level),
                rank = u.Rank
            });

            return Json(list);
        }


        [HttpGet]
        public async Task<IActionResult> Profile()
        {
            var username = HttpContext.Session.GetString("Username");
            if (username == null)
                return RedirectToAction("Login");

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Username == username);
            if (user == null)
                return RedirectToAction("Login");

            string rank = user.BestScore switch
            {
                >= 110 => "Ultimate Champion 🏆",
                >= 90 => "Diamond 💎",
                >= 70 => "Platinum ⚜️",
                >= 50 => "Gold 🥇",
                >= 40 => "Silver 🥈",
                >= 30 => "Bronze 🥉",
                >= 20 => "Wood 🌲",
                _ => "Beginner ✅"
            };

            // 🏅 Избираме подходящия бадж за нивото
            string badgeImage = user.Level switch
            {
                <= 5 => "/images/bronze.png",
                <= 10 => "/images/silver.png",
                <= 15 => "/images/gold.png",
                <= 20 => "/images/diamond.png",
                _ => "/images/master.png"
            };

            // ⚙️ Изчисляваме прогреса до следващото ниво
            int requiredXP = RequiredXPForNextLevel(user.Level);
            int currentXP = user.XP;
            double progressPercent = Math.Min((double)currentXP / requiredXP * 100, 100);
            int remainingXP = Math.Max(requiredXP - currentXP, 0);
            var avatarPath = user.AvatarUrl;
            if (string.IsNullOrEmpty(user.AvatarUrl))
                user.AvatarUrl = "/images/avatar/default-avatar.jpg";

            // 🧩 Създаваме модела за View-то
            var model = new
            {
                user.Username,
                user.Email,
                user.BestScore,
                user.Level,
                user.XP,
                RequiredXP = requiredXP,
                ProgressPercent = progressPercent,
                RemainingXP = remainingXP,
                Rank = rank,
                BadgeImage = badgeImage,
                AvatarUrl = avatarPath
            };

            return View(model);
        }

        [HttpGet]
        public async Task<IActionResult> Leaderboard()
        {
            var top = await _context.Users
                .OrderByDescending(u => u.BestScore)
                .Take(10)
                .ToListAsync();

            var result = top.Select(u => new
            {
                username = u.Username,
                bestScore = u.BestScore,
                rank = u.Rank,
                badgeImage = GetBadgeForLevel(u.Level)
            }).ToList();

            return Json(result);
        }

        private int RequiredXPForNextLevel(int level)
        {
            return level switch
            {
                1 => 5,
                2 => 10,
                3 => 15,
                4 => 20,
                5 => 30,
                6 => 35,
                7 => 40,
                8 => 50,
                9 => 60,
                10 => 75,
                _ => (int)(75 + (level - 10) * 10)
            };
        }

        private string GetRank(int score)
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

        public IActionResult Logout()
        {
            HttpContext.Session.Clear();
            return RedirectToAction("Index", "Home");
        }

        private static string HashPassword(string password)
        {
            using var sha = SHA256.Create();
            var bytes = sha.ComputeHash(Encoding.UTF8.GetBytes(password));
            return Convert.ToBase64String(bytes);
        }

        private static bool VerifyPassword(string password, string hash)
            => HashPassword(password) == hash;

        private string GetBadgeForLevel(int level)
        {
            if (level < 5) return "/images/bronze.png";
            if (level < 10) return "/images/silver.png";
            if (level < 15) return "/images/gold.png";
            if (level < 20) return "/images/diamond.png";
            return "/images/master.png";
        }
    }
}
