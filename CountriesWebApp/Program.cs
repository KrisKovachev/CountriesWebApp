using CountriesWebApp.Data_Base;
using CountriesWebApp.Services;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// 💾 Конфигурация на основната база данни
builder.Services.AddDbContext<WebAppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// 💾 Конфигурация на базата данни за потребители
builder.Services.AddDbContext<UserDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("UserConnection")));

// 🧠 Регистрираме CountryService
builder.Services.AddScoped<CountryService>();

// ✅ Активираме MVC с Razor Views
builder.Services.AddControllersWithViews();

// ✅ Добавяме поддръжка на сесии
builder.Services.AddDistributedMemoryCache();
builder.Services.AddSession(options =>
{
    options.IdleTimeout = TimeSpan.FromMinutes(30);
    options.Cookie.HttpOnly = true;
    options.Cookie.IsEssential = true;
});

// ✅ Нужен за достъп до HttpContext в контролери и вюта
builder.Services.AddHttpContextAccessor();

var app = builder.Build();

// 🔒 Middleware конфигурация
app.UseHttpsRedirection();
app.UseStaticFiles();

app.UseRouting();

// 🧩 Задължително преди Authorization
app.UseSession();

app.UseAuthorization();

app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}");

app.Run();
