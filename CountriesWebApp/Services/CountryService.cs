using CountriesWebApp.Data_Base;
using CountriesWebApp.Models;
using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json.Linq;

namespace CountriesWebApp.Services
{
    public class CountryService
    {
        private readonly HttpClient _httpClient;
        private readonly WebAppDbContext _context;

        public CountryService(WebAppDbContext context)
        {
            _httpClient = new HttpClient();
            _context = context;
        }

        public async Task<CountryStats?> GetCountryStatsAsync(string countryName)
        {
            if (string.IsNullOrWhiteSpace(countryName))
                return null;

            try
            {
                string url = $"https://restcountries.com/v3.1/name/{Uri.EscapeDataString(countryName)}?fullText=true";
                var response = await _httpClient.GetAsync(url);

                if (!response.IsSuccessStatusCode)
                    return null;

                var result = await response.Content.ReadAsStringAsync();
                var json = JArray.Parse(result);
                if (json.Count == 0)
                    return null;

                var country = json[0];

                var stats = new CountryStats
                {
                    Name = country["name"]?["common"]?.ToString() ?? "N/A",
                    Capital = (country["capital"] is JArray capitals && capitals.Count > 0)
                        ? capitals[0]?.ToString() ?? "N/A"
                        : "N/A",
                    Region = country["region"]?.ToString() ?? "N/A",
                    FlagUrl = country["flags"]?["png"]?.ToString() ?? "",
                    Population = (long?)country["population"] ?? 0,
                    Area = (double?)country["area"] ?? 0,
                    Language = country["languages"] != null
                        ? string.Join(", ", ((JObject)country["languages"]).Properties().Select(p => p.Value.ToString()))
                        : "N/A",
                    Currency = GetCurrencyName(country)
                };

                // ✅ Проверяваме асинхронно и игнорираме разликата в case
                if (!await _context.CountryData.AnyAsync(c => c.Name.ToLower() == stats.Name.ToLower()))
                {
                    _context.CountryData.Add(stats);
                    await _context.SaveChangesAsync();
                    Console.WriteLine($"✅ {stats.Name} added to DB.");
                }
                else
                {
                    Console.WriteLine($"ℹ️ {stats.Name} already exists in DB.");
                }

                return stats;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Error fetching data: {ex.Message}");
                return null;
            }
        }

        private static string GetCurrencyName(JToken country)
        {
            var currencies = country["currencies"];
            if (currencies == null)
                return "N/A";

            var firstCurrency = ((JObject)currencies).Properties().FirstOrDefault();
            if (firstCurrency == null)
                return "N/A";

            var code = firstCurrency.Name;
            var name = firstCurrency.Value["name"]?.ToString() ?? "N/A";

            return $"{name} ({code})";
        }
    }
}
