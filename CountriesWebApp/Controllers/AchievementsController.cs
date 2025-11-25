using System.Linq;
using System.Threading.Tasks;
using CountriesWebApp.Core.Models;
using CountriesWebApp.Core.Models.ViewModel;
using CountriesWebApp.Core.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace CountriesWebApp.Controllers
{
    public class AchievementsController : Controller
    {
        private readonly AchievementService _service;

        public AchievementsController(AchievementService service)
        {
            _service = service;
        }

        // 🔓 API за отключване, вика се от JS
        [HttpPost]
        public async Task<IActionResult> Unlock(string code)
        {
            var username = HttpContext.Session.GetString("Username");
            if (string.IsNullOrEmpty(username))
                return Unauthorized();

            if (string.IsNullOrEmpty(code))
                return BadRequest();

            var unlocked = await _service.UnlockAsync(username, code);

            return Json(new { unlocked });
        }

        // 🏆 Страница със списък achievements
        [HttpGet]
        public async Task<IActionResult> Index()
        {
            var username = HttpContext.Session.GetString("Username");
            if (string.IsNullOrEmpty(username))
                return RedirectToAction("Login", "Auth");

            var all = await _service.GetAllAsync();
            var userUnlocked = await _service.GetUserAchievementsAsync(username);

            var model = all.Select(a => new AchievementViewModel
            {
                Code = a.Code,
                Title = a.Title,
                Description = a.Description,
                Points = a.Points,
                Unlocked = userUnlocked.Any(x => x.AchievementCode == a.Code)
            }).ToList();

            return View(model);
        }
    }
}
