document.addEventListener("DOMContentLoaded", () => {
    // 🔆 Dark mode toggle само за тази страница
    const btn = document.getElementById("darkModeToggle");
    if (btn) {
        // apply saved state
        if (localStorage.getItem("gm-dark") === "1") {
            document.body.classList.add("dark-mode");
            btn.textContent = "☀️ Light Mode";
        } else {
            btn.textContent = "🌙 Dark Mode";
        }

        btn.addEventListener("click", () => {
            document.body.classList.toggle("dark-mode");
            const isDark = document.body.classList.contains("dark-mode");
            localStorage.setItem("gm-dark", isDark ? "1" : "0");
            btn.textContent = isDark ? "☀️ Light Mode" : "🌙 Dark Mode";
        });
    }

    // 🎮 Навигация към режимите
    const routes = {
        flagMode: "/Home/Menu",
        capitalMode: "/Home/Capital",
        geoheatMode: "/Home/GeoHeat",
        flagquizMode: "/Home/FlagMenu",
        bgGeoMode: "/Home/BgGeoHeat"
    };

    Object.keys(routes).forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener("click", () => {
                localStorage.setItem("gameMode", id.replace("Mode", ""));
                window.location.href = routes[id];
            });
        }
    });
});
