using CountriesWebApp.Data_Base;
using CountriesWebApp.Services;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// 💾 Конфигурация на базата данни
builder.Services.AddDbContext<WebAppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// 🧠 Регистрираме CountryService
builder.Services.AddScoped<CountryService>();

// ✅ Активираме MVC с Razor Views
builder.Services.AddControllersWithViews();

// (по желание) Swagger само ако имаш нужда от API документация
builder.Services.AddEndpointsApiExplorer();

var app = builder.Build();

app.UseHttpsRedirection();
app.UseStaticFiles();

app.UseRouting();

app.UseAuthorization();

// 🗺️ Настройка на маршрутите (Route mapping)
app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}");

app.Run();
