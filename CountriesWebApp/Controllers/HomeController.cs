using CountriesWebApp.Models;
using Microsoft.AspNetCore.Mvc;
using System.Diagnostics;

namespace CountriesWebApp.Controllers
{
    public class HomeController : Controller
    {
        private readonly ILogger<HomeController> _logger;

        public HomeController(ILogger<HomeController> logger)
        {
            _logger = logger;
        }

        // Главна страница — Country Info
        public IActionResult Index()
        {
            _logger.LogInformation("Home page loaded.");
            return View();
        }

        public IActionResult Gamemode()
        {
            _logger.LogInformation("Gamemode selection page loaded.");
            return View();
        }

        public IActionResult Capital()
        {
            _logger.LogInformation("Capital gamemode page loaded.");
            return View();  
        }

        public IActionResult GeoHeat()
        {
            _logger.LogInformation("Geo Heat gamemode page loaded.");
            return View();
        }


        // 🧭 Меню за избор на континент 
        public IActionResult Menu()
        {
            _logger.LogInformation("Menu page loaded.");
            return View();
        }

        // 🏁 Страница с куиза
        public IActionResult Quiz()
        {
            _logger.LogInformation("Quiz page loaded.");
            return View();
        }

        // Страница Privacy (оставяме я за пример)
        public IActionResult Privacy()
        {
            return View();
        }

        // Error handling (оставяме без промяна)
        [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
        public IActionResult Error()
        {
            return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
        }

    }
}
