console.log("index.js LOADED");

// DARK MODE 
document.addEventListener("DOMContentLoaded", () => {
    console.log("DOM fully loaded");

    const toggle = document.getElementById("darkModeToggle");

    if (!toggle) {
        console.warn("darkModeToggle not found");
        return;
    }

    // Dark mode loading
    if (localStorage.getItem("index-dark") === "1") {
        document.documentElement.classList.add("dark-mode");
        document.body.classList.add("dark-mode");
        toggle.textContent = "☀️ Light Mode";
    }

    toggle.onclick = () => {
        document.documentElement.classList.toggle("dark-mode");
        document.body.classList.toggle("dark-mode");

        const isDark = document.body.classList.contains("dark-mode");
        localStorage.setItem("index-dark", isDark ? "1" : "0");

        toggle.textContent = isDark ? "☀️ Light Mode" : "🌙 Dark Mode";
    };
});

// ГЛАВНАТА ФУНКЦИЯ – ВИКА СЕ ОТ HTML: onclick="fetchCountry()"
async function fetchCountry() {
    console.log("fetchCountry called");

    const name = document.getElementById("countryName").value.trim();
    const message = document.getElementById("message");
    const resultBox = document.getElementById("result");

    const resName = document.getElementById("resName");
    const resCapital = document.getElementById("resCapital");
    const resRegion = document.getElementById("resRegion");
    const resPopulation = document.getElementById("resPopulation");
    const resFlag = document.getElementById("resFlag");

    if (!name) {
        message.innerHTML = "<span style='color:red;'>Please enter a country name.</span>";
        resultBox.style.display = "none";
        return;
    }

    message.innerHTML = "<span style='color:#888;'>Searching...</span>";
    console.log("Searching for:", name);

    try {
        const res = await fetch(`https://restcountries.com/v3.1/name/${encodeURIComponent(name)}?fullText=false`);

        console.log("Response status:", res.status);

        if (!res.ok) {
            message.innerHTML = "<span style='color:red;'>Country not found.</span>";
            resultBox.style.display = "none";
            return;
        }

        const data = await res.json();
        console.log("API data:", data);

        if (!Array.isArray(data) || data.length === 0) {
            message.innerHTML = "<span style='color:red;'>No data returned.</span>";
            resultBox.style.display = "none";
            return;
        }

        const country = data[0];

        // Fill UI
        resName.textContent = country.name && country.name.common ? country.name.common : "Unknown";
        resCapital.textContent = Array.isArray(country.capital) && country.capital.length > 0
            ? country.capital[0]
            : "No capital";

        resRegion.textContent = country.region || "Unknown";
        resPopulation.textContent = country.population
            ? country.population.toLocaleString()
            : "Unknown";

        if (country.flags && (country.flags.png || country.flags.svg)) {
            resFlag.src = country.flags.png || country.flags.svg;
            resFlag.style.display = "block";
        } else {
            resFlag.style.display = "none";
        }

        resultBox.style.display = "block";
        message.innerHTML = "<span style='color:lightgreen;'>Success!</span>";

    } catch (err) {
        console.error("Fetch error:", err);
        message.innerHTML = "<span style='color:red;'>Error fetching data.</span>";
        resultBox.style.display = "none";
    }
}
