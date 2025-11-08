using System.ComponentModel.DataAnnotations;

namespace CountriesWebApp.Models
{
    public class CountryStats
    {
        [Key]
        public int Id { get; set; }

        public string Name { get; set; } = string.Empty;
        public string Capital { get; set; } = string.Empty;
        public string Region { get; set; } = string.Empty;
        public string Currency { get; set; } = string.Empty;
        public string FlagUrl { get; set; } = string.Empty;
        public long Population { get; set; }
        public double Area { get; set; }
        public string Language { get; set; } = string.Empty;
    }
}
