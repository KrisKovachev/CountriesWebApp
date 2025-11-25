document.addEventListener("DOMContentLoaded", () => {
    console.log("index.js loaded!");

    const searchBtn = document.getElementById("searchBtn");
    if (!searchBtn) {
        console.error("searchBtn NOT FOUND!");
        return;
    }

    searchBtn.addEventListener("click", fetchCountry);

    // Dark mode logic
    const toggle = document.getElementById("darkModeToggle");
    if (toggle) {
        if (localStorage.getItem("index-dark") === "1") {
            document.documentElement.classList.add("dark-mode");
            document.body.classList.add("dark-mode");
            toggle.textContent = "☀️ Light Mode";
        }

        toggle.addEventListener("click", () => {
            document.documentElement.classList.toggle("dark-mode");
            document.body.classList.toggle("dark-mode");
            const isDark = document.body.classList.contains("dark-mode");
            localStorage.setItem("index-dark", isDark ? "1" : "0");
            toggle.textContent = isDark ? "☀️ Light Mode" : "🌙 Dark Mode";
        });
    }
});

async function fetchCountry() {
    console.log("fetchCountry() triggered");

    const name = document.getElementById("countryName").value.trim();
    const message = document.getElementById("message");
    const resultDiv = document.getElementById("result");

    if (!name) {
        message.innerHTML = "<p style='color:red;'>Please enter a country!</p>";
        return;
    }

    message.innerHTML = "Loading...";
    resultDiv.style.display = "none";

    try {
        const response = await fetch(`/api/country/${encodeURIComponent(name)}`);

        if (!response.ok) {
            message.innerHTML = "<p style='color:red;'>Country not found.</p>";
            return;
        }

        const data = await response.json();

        document.getElementById("resName").innerText = data.name;
        document.getElementById("resCapital").innerText = data.capital;
        document.getElementById("resRegion").innerText = data.region;
        document.getElementById("resCurrency").innerText = data.currency;

        const flagEl = document.getElementById("resFlag");
        flagEl.src = data.flagUrl;
        flagEl.style.display = "block";

        resultDiv.style.display = "block";

        // save to DB
        await fetch("/api/country/save", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });

        message.innerHTML = "<p style='color:green;'>Saved to DB!</p>";

    } catch (err) {
        console.error(err);
        message.innerHTML = "<p style='color:red;'>Error loading data!</p>";
    }
}

// Make function global
window.fetchCountry = fetchCountry;
