async function fetchCountry() {
    const name = document.getElementById("countryName").value.trim();
    const message = document.getElementById("message");
    const resultDiv = document.getElementById("result");

    if (!name) {
        message.innerHTML = "<p style='color:red;'>Please enter a country!</p>";
        return;
    }

    message.innerHTML = "<p>Loading data...</p>";
    resultDiv.style.display = "none";

    try {
        const response = await fetch(`/api/country/${encodeURIComponent(name)}`);
        if (!response.ok) {
            message.innerHTML = "<p style='color:red;'>Country not found.</p>";
            return;
        }
        const data = await response.json();
        message.innerHTML = "<p style='color:green;'>Data loaded successfully!</p>";

        document.getElementById("resName").innerText = data.name || "N/A";
        document.getElementById("resCapital").innerText = data.capital || "N/A";
        document.getElementById("resRegion").innerText = data.region || "N/A";
        document.getElementById("resCurrency").innerText = data.currency || "N/A";

        const flagEl = document.getElementById("resFlag");
        if (data.flagUrl) {
            flagEl.src = data.flagUrl;
            flagEl.alt = `${data.name} flag`;
            flagEl.style.display = "block";
        } else {
            flagEl.style.display = "none";
        }

        resultDiv.style.display = "block";
    } catch (err) {
        console.error(err);
        message.innerHTML = "<p style='color:red;'>Error loading data!</p>";
    }
}
