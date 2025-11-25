using CountriesWebApp.Core.Services;
using Microsoft.AspNetCore.Mvc;

namespace CountriesWebApp.Controllers
{
    [ApiController]
    [Route("api/country")]
    public class CountryController : ControllerBase
    {
        private readonly CountryService _countryService;

        public CountryController(CountryService countryService)
        {
            _countryService = countryService;
        }

        [HttpGet("{name}")]
        public async Task<IActionResult> GetCountry(string name)
        {
            var country = await _countryService.GetCountryStatsAsync(name);
            if (country == null)
                return NotFound();

            return Ok(country);
        }


    }
}