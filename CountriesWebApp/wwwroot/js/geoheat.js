let map;
let guessLayerGroup;

let countries = [];
let secretCountry = null;

// store all guessed correct names
let guessedCountries = new Set();

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("guessBtn").addEventListener("click", onGuess);
    document.getElementById("countryInput").addEventListener("keydown", e => {
        if (e.key === "Enter") onGuess();
    });

    document.getElementById("giveUpBtn").addEventListener("click", giveUp);

    initMap();
});

async function initMap() {
    const mapEl = document.getElementById("map");
    if (mapEl) {
        mapEl.style.width = "700px";
        mapEl.style.maxWidth = "100%";
    }

    map = L.map("map", {
        worldCopyJump: false,
        zoomControl: true,
        maxBounds: [[-85, -180], [85, 180]],
        maxBoundsViscosity: 1.0
    }).setView([20, 0], 2);

    L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png",
        {
            subdomains: "abcd",
            maxZoom: 6,
            noWrap: true,
            bounds: [[-85, -180], [85, 180]]
        }
    ).addTo(map);

    guessLayerGroup = L.layerGroup().addTo(map);

    const geo = await fetch("/data/customgeo.json").then(r => r.json());

    countries = geo.features.map(f => {
        const p = f.properties;

        const name = p.ADMIN || p.name || p.NAME;
        const iso2 = (p.ISO_A2 || p.iso2 || "").toLowerCase();
        const iso3 = (p.ISO_A3 || p.iso3 || "").toLowerCase();

        return {
            feature: f,
            name,
            norm: normalize(name),
            iso2,
            iso3,
            center: getCenter(f),

            // partial match tokens
            partialNames: buildPartialNames(name, iso2, iso3)
        };
    });

    L.geoJSON(geo, {
        style: {
            color: "#333",
            weight: 0.7,
            fillOpacity: 0.10
        }
    }).addTo(map);

    setTimeout(() => map.invalidateSize(), 200);

    startRound();
}

// create partial search tokens
function buildPartialNames(name, iso2, iso3) {
    const tokens = new Set();

    const norm = normalize(name);
    tokens.add(norm);

    // separate word tokens
    name.toLowerCase().split(/[\s]+/).forEach(p => tokens.add(normalize(p)));

    // concatenated
    tokens.add(norm.replace(/ /g, ""));

    // iso codes
    if (iso2) tokens.add(iso2);
    if (iso3) tokens.add(iso3);

    return Array.from(tokens);
}

function startRound() {
    guessLayerGroup.clearLayers();
    document.getElementById("guessList").innerHTML = "";

    guessedCountries.clear(); // reset guessed list

    secretCountry = countries[Math.floor(Math.random() * countries.length)];

    map.setView(secretCountry.center, 2);

    showMessage("Guess the hidden country!", "#7fd0ff");
}

function onGuess() {
    const inputEl = document.getElementById("countryInput");
    const val = inputEl.value.trim().toLowerCase();
    const normVal = normalize(val);

    if (!val) return;

    // find matching country (original logic + partial)
    const guess = countries.find(c =>
        c.norm === normVal ||
        c.iso2 === val ||
        c.iso3 === val ||
        val.includes("(" + c.iso2 + ")") ||
        val.includes("(" + c.iso3 + ")") ||
        c.partialNames.some(t => t.startsWith(normVal))
    );

    if (!guess) {
        showMessage("❌ Country not found", "#ff6666");
        inputEl.value = "";
        return;
    }

    // 🔥🔥 FIXED: duplicate check is HERE — BEFORE processing
    if (guessedCountries.has(guess.name)) {
        showMessage("⚠️ You already guessed this country!", "#ffcc00");
        inputEl.value = "";
        inputEl.focus();
        return;
    }

    // mark as guessed (so any future partial matches are blocked)
    guessedCountries.add(guess.name);

    const dist = haversine(guess.center, secretCountry.center);
    const color = getHeatColor(dist);

    const layer = L.geoJSON(guess.feature, {
        style: {
            color,
            fillColor: color,
            weight: 2,
            fillOpacity: 0.5
        }
    }).addTo(guessLayerGroup);

    addGuess(guess.name, dist, color);

    if (dist < 100) {
        showMessage(`🎉 Correct! ${guess.name} is the secret country!`, "#6aff6a");

        L.geoJSON(secretCountry.feature, {
            style: {
                color: "#4caf50",
                fillColor: "#4caf50",
                fillOpacity: 0.6,
                weight: 3
            }
        }).addTo(guessLayerGroup);

        map.fitBounds(layer.getBounds(), { maxZoom: 5 });

        setTimeout(startRound, 3000);
    } else {
        showMessage(`📍 ${guess.name} is ${Math.round(dist)} km away.`, color);
    }

    inputEl.value = "";
    inputEl.focus();
}

function getHeatColor(dist) {
    if (dist > 6000) return "#ff0033";
    if (dist > 4000) return "#ff6600";
    if (dist > 2500) return "#ffaa00";
    if (dist > 1200) return "#d4ff00";
    if (dist > 300) return "#66ff66";
    return "#00ff88";
}

function addGuess(name, dist, color) {
    const row = document.createElement("div");
    row.className = "geoheat-guess-item";
    row.style.borderLeftColor = color;

    row.innerHTML = `
        <span>${name}</span>
        <span>${Math.round(dist)} km</span>
    `;

    document.getElementById("guessList").prepend(row);
}

function normalize(s) {
    return s
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z]/g, "");
}

function getCenter(feature) {
    const layer = L.geoJSON(feature);
    const c = layer.getBounds().getCenter();
    return [c.lat, c.lng];
}

function haversine(a, b) {
    const R = 6371;
    const dLat = (b[0] - a[0]) * Math.PI / 180;
    const dLon = (b[1] - a[1]) * Math.PI / 180;

    const lat1 = a[0] * Math.PI / 180;
    const lat2 = b[0] * Math.PI / 180;

    const h = Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1) * Math.cos(lat2) *
        Math.sin(dLon / 2) ** 2;

    return 2 * R * Math.asin(Math.sqrt(h));
}

function showMessage(msg, color) {
    const el = document.getElementById("message");
    el.style.color = color;
    el.textContent = msg;
}

function giveUp() {
    guessLayerGroup.clearLayers();

    const layer = L.geoJSON(secretCountry.feature, {
        style: {
            color: "#ff4444",
            fillColor: "#ff4444",
            fillOpacity: 0.6,
            weight: 3
        }
    }).addTo(guessLayerGroup);

    map.fitBounds(layer.getBounds(), { maxZoom: 5 });

    showMessage(`❗ The secret country was: ${secretCountry.name}`, "#ff4444");

    setTimeout(startRound, 3000);
}
