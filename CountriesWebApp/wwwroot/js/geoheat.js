// ==========================
// GeoHeat - Full Working Game (BACKEND API + GeoJSON)
// ==========================

let countries = [];
let guesses = [];
let mystery = null;

const toRad = d => d * Math.PI / 180;

function distanceKm(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) ** 2;

    return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const normalize = s =>
    s.toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();

const heatColor = d => {
    if (d < 500) return "#ff3333";
    if (d < 1500) return "#ff7b00";
    if (d < 3000) return "#ffcc00";
    if (d < 6000) return "#3ab4ff";
    return "#0a2d52";
};

document.addEventListener("DOMContentLoaded", async () => {

    const container = document.getElementById("globeContainer");
    const input = document.getElementById("countryInput");
    const btn = document.getElementById("guessBtn");
    const msg = document.getElementById("message");
    const list = document.getElementById("guessList");

    const setMessage = (t, c = "#ffffff") => {
        msg.textContent = t;
        msg.style.color = c;
    };

    // ============================================
    // STEP 1 — LOAD BACKEND COUNTRY LIST
    // ============================================
    let apiCountries = [];

    try {
        const r = await fetch("/Country/GetAll"); // <-- ЕТО ГО ДЕТО БЕШЕ ПРОБЛЕМА
        apiCountries = await r.json();
    } catch (e) {
        console.error("API load error:", e);
        setMessage("Failed to load country API.", "red");
        return;
    }

    apiCountries = apiCountries.map(c => ({
        name: c.name,
        code: c.code,
        lat: c.latitude,
        lon: c.longitude
    }));

    console.log("Backend countries:", apiCountries.length);


    // ============================================
    // STEP 2 — LOAD GEOJSON SHAPES
    // ============================================
    let geoJSON = null;

    try {
        geoJSON = await fetch("/data/customgeo.json").then(r => r.json());
    } catch (e) {
        console.error("GeoJSON error:", e);
        setMessage("Failed to load map shapes.", "red");
        return;
    }


    // ============================================
    // STEP 3 — MERGE SHAPES WITH API USING ISO CODE
    // ============================================
    countries = geoJSON.features.map(f => {
        const props = f.properties || {};

        if (!f.geometry || !f.geometry.coordinates) return null;

        const centroid = d3.geoCentroid(f);
        if (!isFinite(centroid[0]) || !isFinite(centroid[1])) return null;

        // ISO code from GeoJSON
        const iso = props.ISO_A3 || props.iso_a3 || props.ADM0_A3;
        if (!iso) return null;

        // match API country by ISO code
        const apiMatch = apiCountries.find(c =>
            normalize(c.code) === normalize(iso)
        );

        if (!apiMatch) return null;

        return {
            ...f,
            countryName: apiMatch.name,
            countryId: apiMatch.code,
            lat: apiMatch.lat,
            lon: apiMatch.lon
        };
    }).filter(Boolean);

    console.log("Merged countries:", countries.length);

    if (!countries.length) {
        setMessage("No countries matched API.", "red");
        return;
    }


    // ============================================
    // STEP 4 — INIT GLOBE
    // ============================================
    const globe = Globe()
        (container)
        .globeImageUrl("//unpkg.com/three-globe/example/img/earth-dark.jpg")
        .showAtmosphere(true)
        .atmosphereColor("#4faaff")
        .atmosphereAltitude(0.18)
        .backgroundColor("rgba(0,0,0,0)")
        .polygonsData(countries)
        .polygonCapColor(() => "#0e1220")
        .polygonSideColor(() => "rgba(0,0,0,0.4)")
        .polygonStrokeColor(() => "#1b2339")
        .polygonStrokeWidth(0.5)
        .polygonAltitude(0.012);

    globe.pointOfView({ lat: 0, lng: 0, altitude: 2.1 }, 0);


    // ============================================
    // STEP 5 — MYSTERY COUNTRY
    // ============================================
    mystery = countries[Math.floor(Math.random() * countries.length)];
    setMessage("Mystery country selected. Start guessing!", "#9bb5ff");


    // ============================================
    // STEP 6 — HELPERS
    // ============================================
    const updateColors = () => {
        globe.polygonCapColor(f => {
            const g = guesses.find(x => x.id === f.countryId);
            return g ? heatColor(g.dist) : "#0e1220";
        });
    };

    const updateList = () => {
        list.innerHTML = guesses
            .sort((a, b) => a.dist - b.dist)
            .map(g => `
                <div class="geoheat-guess-item">
                    <span class="name">${g.name}</span>
                    <span class="dist">${Math.round(g.dist)} km</span>
                </div>
            `)
            .join("");
    };


    // ============================================
    // STEP 7 — GUESS HANDLER
    // ============================================
    function handleGuess() {
        const val = normalize(input.value);
        if (!val) return;

        const match = countries.find(c =>
            normalize(c.countryName) === val
        );

        if (!match) {
            setMessage("Unknown country.", "red");
            return;
        }

        if (guesses.some(g => g.id === match.countryId)) {
            setMessage("Already guessed.", "#ffcc00");
            return;
        }

        const dist = distanceKm(match.lat, match.lon, mystery.lat, mystery.lon);

        guesses.push({
            id: match.countryId,
            name: match.countryName,
            dist
        });

        updateColors();
        updateList();

        globe.pointOfView(
            { lat: match.lat, lng: match.lon, altitude: 1.8 },
            800
        );

        if (match.countryId === mystery.countryId) {
            setMessage(`🔥 GG! You found ${mystery.countryName}!`, "#4fff9c");
        } else {
            setMessage(`${match.countryName} is ${Math.round(dist)} km away.`, "#66aaff");
        }

        input.value = "";
    }

    btn.addEventListener("click", handleGuess);
    input.addEventListener("keydown", e => {
        if (e.key === "Enter") {
            e.preventDefault();
            handleGuess();
        }
    });
});
