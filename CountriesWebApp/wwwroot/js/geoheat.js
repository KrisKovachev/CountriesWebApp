// --- Leaflet карта (без етикети) ---
let map = L.map('map', {
    maxBounds: [[85, -180], [-85, 180]],
    maxBoundsViscosity: 1.0,
    minZoom: 2,
    maxZoom: 6
}).setView([20, 0], 2);

L.tileLayer('https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OpenStreetMap &copy; CARTO'
}).addTo(map);

// --- Състояние ---
let geoLayer;
let geoCountries = [];
let restCountries = [];
let target;
let guessed = [];

const geoIndexByName = new Map();
const geoIndexByISO2 = new Map();

const manualNameMap = {
    "bosniaandherzegovina": "Bosnia and Herzegovina",
    "ivorycoast": "Côte d'Ivoire",
    "cotedivoire": "Côte d'Ivoire",
    "southsudan": "South Sudan",
    "democraticrepublicofthecongo": "Democratic Republic of the Congo",
    "republicofthecongo": "Republic of the Congo",
    "northmacedonia": "North Macedonia",
    "czechrepublic": "Czechia",
    "eswatini": "Eswatini",
    "myanmar": "Myanmar",
    "myanmarburma": "Myanmar",
    "syria": "Syria",
    "capeverde": "Cabo Verde",
    "kosovo": "Kosovo"
};

// --- Утилити функции ---
function normName(s) {
    return (s || "")
        .normalize('NFD').replace(/\p{Diacritic}/gu, '')
        .toLowerCase()
        .replace(/[^a-z]/g, '');
}

function pickProp(props, keys) {
    for (const k of keys) {
        const hit = Object.keys(props).find(p => p.toLowerCase() === k.toLowerCase());
        if (hit) return props[hit];
    }
    return undefined;
}

function extractISO2(props) {
    const iso = pickProp(props, ['iso_a2', 'ISO_A2', 'iso2', 'cca2', 'wb_a2', 'ADM0_A3_IS']);
    if (!iso) return undefined;
    const v = String(iso).toUpperCase();
    if (v === '-99' || v === 'NA' || v.length > 3) return undefined;
    if (v.length >= 2) return v.slice(0, 2);
    return undefined;
}

// --- Зареждаме данните ---
async function loadRestCountries() {
    const res = await fetch('https://restcountries.com/v3.1/all?fields=name,latlng,cca2,cca3,altSpellings');
    const data = await res.json();

    restCountries = data.map(c => {
        const name = c?.name?.common || '';
        const n = normName(name);
        const alts = (c.altSpellings || []).map(a => normName(a)).filter(Boolean);
        return {
            name,
            latlng: c.latlng || [],
            cca2: (c.cca2 || '').toUpperCase(),
            cca3: (c.cca3 || '').toUpperCase(),
            norm: n,
            altNorms: alts
        };
    });
}

async function loadGeoData() {
    const res = await fetch('/data/customgeo.json');
    const gj = await res.json();

    geoLayer = L.geoJSON(gj, {
        style: { color: '#333', weight: 1, fillColor: '#ccc', fillOpacity: 0.4 }
    }).addTo(map);

    geoLayer.eachLayer(layer => {
        const props = layer.feature.properties || {};
        const name = pickProp(props, ['name', 'NAME', 'admin', 'ADMIN', 'sovereignt', 'SOVEREIGNT']) || '';
        const nn = normName(name);
        const iso2 = extractISO2(props);

        geoCountries.push({ layer, name, norm: nn, iso2 });

        if (nn) geoIndexByName.set(nn, layer);
        if (iso2) geoIndexByISO2.set(iso2, layer);
    });
}

function findGeoLayerForCountry(rc) {
    if (rc.cca2 && geoIndexByISO2.has(rc.cca2)) return geoIndexByISO2.get(rc.cca2);
    if (geoIndexByName.has(rc.norm)) return geoIndexByName.get(rc.norm);

    const manual = manualNameMap[rc.norm];
    if (manual) {
        const mm = normName(manual);
        if (geoIndexByName.has(mm)) return geoIndexByName.get(mm);
    }

    for (const alt of rc.altNorms) {
        if (geoIndexByName.has(alt)) return geoIndexByName.get(alt);
    }

    const hit = geoCountries.find(g => g.name.toLowerCase().includes(rc.name.toLowerCase()));
    return hit ? hit.layer : null;
}

// --- Инициализация ---
(async function init() {
    await loadRestCountries();
    await loadGeoData();
    resetGame();
})();

function resetGame() {
    guessed = [];
    document.getElementById('guesses-list').innerHTML = "";
    document.getElementById('message').innerHTML = "";

    target = restCountries[Math.floor(Math.random() * restCountries.length)];
    while (!Array.isArray(target.latlng) || target.latlng.length < 2) {
        target = restCountries[Math.floor(Math.random() * restCountries.length)];
    }

    geoLayer.eachLayer(l => l.setStyle({ fillColor: '#ccc', fillOpacity: 0.4, color: '#333' }));
}

// --- Изчисления ---
function distanceKm(rcA, rcB) {
    const [lat1, lon1] = rcA.latlng;
    const [lat2, lon2] = rcB.latlng;
    if ([lat1, lon1, lat2, lon2].some(v => typeof v !== 'number')) return Infinity;

    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const h = Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
}

function colorByDistance(d) {
    if (d <= 0.5) return '#00ff00';
    if (d >= 8000) return '#ff0000';
    const t = 1 - Math.min(d / 8000, 1);
    const r = Math.round(255 * (1 - t));
    const g = Math.round(255 * t);
    return `rgb(${r},${g},0)`;
}

function updateGuessList(name, distance, color) {
    const list = document.getElementById('guesses-list');
    const div = document.createElement('div');
    div.classList.add('guess-item');
    div.innerHTML = `<b style="color:${color}">${name}</b> — ${distance.toFixed(0)} km`;
    list.prepend(div);
}

// --- Основна логика ---
function handleGuess() {
    const input = document.getElementById('countryInput');
    const raw = input.value.trim();
    input.value = '';
    if (!raw) return;

    const n = normName(raw);
    let rc = restCountries.find(c => c.norm === n || c.altNorms.includes(n));

    // 👇 ако няма точно съвпадение, опитваме частично съвпадение по име
    if (!rc) {
        rc = restCountries.find(c => c.name.toLowerCase().includes(raw.toLowerCase()));
    }

    if (!rc) {
        document.getElementById('message').innerHTML = `<span style='color:red;'>❌ No such country found.</span>`;
        return;
    }

    if (guessed.includes(rc.name)) return;
    guessed.push(rc.name);

    const layer = findGeoLayerForCountry(rc);
    const layerTarget = findGeoLayerForCountry(target);

    if (!layer || !layerTarget) {
        document.getElementById('message').innerHTML = `<span style='color:red;'>⚠️ Country not found on map.</span>`;
        return;
    }

    const dist = distanceKm(rc, target);
    const color = colorByDistance(dist);
    layer.setStyle({ fillColor: color, fillOpacity: 0.85, color: '#000' });

    if (dist <= 0.5) {
        showWinPopup(target.name, layerTarget);
    } else {
        document.getElementById('message').innerHTML =
            `<span>Your guess <b>${rc.name}</b> is <b style="color:${color}">${dist.toFixed(0)} km</b> away!</span>`;
        updateGuessList(rc.name, dist, color);
    }
}

// --- Победа ---
function showWinPopup(countryName, layerTarget) {
    const popup = document.createElement('div');
    popup.className = 'win-popup';
    popup.innerHTML = `🎉 You guessed the country!<br><b>${countryName}</b>`;
    document.body.appendChild(popup);

    try {
        const b = layerTarget.getBounds();
        map.flyToBounds(b, { maxZoom: 5.5, padding: [20, 20], duration: 1.8 });
    } catch (_) { }

    setTimeout(() => popup.remove(), 2200);
    setTimeout(() => {
        map.flyTo([20, 0], 2, { duration: 1.2 });
        resetGame();
    }, 3000);
}

// --- GIVE UP ---
function handleGiveUp() {
    if (!target) return;

    const layerTarget = findGeoLayerForCountry(target);
    if (!layerTarget) {
        document.getElementById('message').innerHTML =
            `<span style='color:red;'>⚠️ Secret country not found on map.</span>`;
        return;
    }

    layerTarget.setStyle({ fillColor: '#00ff00', fillOpacity: 0.9, color: '#000' });

    const popup = document.createElement('div');
    popup.className = 'win-popup';
    popup.innerHTML = `💡 You gave up!<br>The country was <b>${target.name}</b>.`;
    document.body.appendChild(popup);

    try {
        const bounds = layerTarget.getBounds();
        map.flyToBounds(bounds, { maxZoom: 5.5, padding: [20, 20], duration: 1.8 });
    } catch (_) { }

    setTimeout(() => popup.remove(), 2500);
    setTimeout(() => {
        map.flyTo([20, 0], 2, { duration: 1.2 });
        resetGame();
    }, 3200);
}

// --- Event Listeners ---
document.addEventListener("DOMContentLoaded", () => {
    const guessBtn = document.getElementById('guessBtn');
    const giveUpBtn = document.getElementById('giveUpBtn');
    const input = document.getElementById('countryInput');

    if (guessBtn) guessBtn.addEventListener('click', handleGuess);
    if (input) input.addEventListener('keydown', e => { if (e.key === 'Enter') handleGuess(); });
    if (giveUpBtn) giveUpBtn.addEventListener('click', handleGiveUp);
});
