using CountriesWebApp.Core.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CountriesWebApp.Core.Interfaces
{
    public interface ICountryService
    {
        Task<ApiCountry?> GetCountryByNameAsync(string name);
        Task<List<ApiCountry>> GetAllCountriesAsync();
        Task<bool> CountryExistsAsync(string name);
        Task<CountryStats?> GetCountryStatsAsync(string name);
    }
}

