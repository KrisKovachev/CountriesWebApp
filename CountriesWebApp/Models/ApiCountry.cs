using Newtonsoft.Json;
using System.Text.Json.Serialization;

namespace CountriesWebApp.Models
{
    public class ApiCountry
    {
        [JsonProperty("gdp")]
        public decimal GDP { get; set; }
        [JsonProperty("life_expectancy_man")]
        public double LifeExpectancy { get; set; }
        public string Capital { get; set; }
    }
}
