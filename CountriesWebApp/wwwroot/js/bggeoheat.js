console.log("BG GeoHeat Guess Mode Loaded");

let SECRET = null;
let tries = 0;

document.addEventListener("DOMContentLoaded", () => {
    setupDarkMode();
    // SVG вече е inline в DOM от Razor, просто го хващаме
    initGame();
});

function setupDarkMode() {
    const toggle = document.getElementById("darkModeToggle");
    if (!toggle) return;

    if (localStorage.getItem("bggeo-dark") === "1") {
        document.body.classList.add("dark-mode");
        toggle.textContent = "☀️ Light Mode";
    }

    toggle.onclick = () => {
        document.body.classList.toggle("dark-mode");
        const isDark = document.body.classList.contains("dark-mode");
        localStorage.setItem("bggeo-dark", isDark ? "1" : "0");
        toggle.textContent = isDark ? "☀️ Light Mode" : "🌙 Dark Mode";
    };
}

async function initGame() {
    console.log("Init BG GeoHeat…");

    const svg = document.querySelector(".map-wrapper svg");
    if (!svg) {
        console.error("SVG NOT FOUND in .map-wrapper");
        return;
    }

    let json;
    try {
        const resp = await fetch("/images/bg.json");
        if (!resp.ok) {
            console.error("Cannot load bg.json:", resp.status);
            return;
        }
        json = await resp.json();
    } catch (e) {
        console.error("Error reading bg.json", e);
        return;
    }

    const regions = parseRegions(json);
    if (!regions.length) {
        console.error("No regions parsed from bg.json");
        return;
    }

    // Random тайна област
    SECRET = regions[Math.floor(Math.random() * regions.length)];
    console.log("SECRET:", SECRET);

    enableClicks(svg, regions);
}


// Четем JSON → правим центроид + SVG ID (същото като properties.id)
function parseRegions(json) {
    if (!json || !Array.isArray(json.features)) return [];

    return json.features
        .map(f => {
            const props = f.properties || {};
            const geom = f.geometry || {};

            const code = props.id;            // напр. "BG02"
            const name = props.name;          // напр. "Burgas"

            const rings = geom.coordinates;
            if (!Array.isArray(rings) || !rings.length) return null;

            // Взимаме първия пръстен
            const coords = rings[0];          // [ [lng,lat], [lng,lat], ... ]
            if (!Array.isArray(coords) || !coords.length) return null;

            let sumLng = 0, sumLat = 0;
            coords.forEach(pair => {
                sumLng += pair[0];
                sumLat += pair[1];
            });

            const n = coords.length;

            return {
                id: code,
                svgId: code, // ВАЖНО: в твоя SVG path id е същото: BG02, BG28, ...
                name: name,
                centroid: {
                    lng: sumLng / n,
                    lat: sumLat / n
                }
            };
        })
        .filter(Boolean);
}


// Активираме hover, click, proximity coloring
function enableClicks(svg, regions) {
    const distSpan = document.getElementById("distValue");
    const triesSpan = document.getElementById("triesValue");

    regions.forEach(r => {
        const el = svg.getElementById(r.svgId);
        if (!el) {
            console.warn("SVG path not found for", r.svgId);
            return;
        }

        el.style.cursor = "pointer";

        el.addEventListener("mousemove", e => {
            showTooltip(e, r.name);
        });

        el.addEventListener("mouseleave", hideTooltip);

        el.addEventListener("click", () => {
            tries++;
            triesSpan.textContent = String(tries);

            const dist = distance(r.centroid, SECRET.centroid);
            distSpan.textContent = Math.round(dist) + " км";

            const color = proximityColor(dist);
            el.style.fill = color;

            if (r.name === SECRET.name) {
                showVictoryPopup(r.name);
            }
        });
    });
}


// Haversine distance (в километри)
function distance(a, b) {
    const R = 6371;
    const dLat = (b.lat - a.lat) * Math.PI / 180;
    const dLng = (b.lng - a.lng) * Math.PI / 180;

    const A =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(a.lat * Math.PI / 180) *
        Math.cos(b.lat * Math.PI / 180) *
        Math.sin(dLng / 2) ** 2;

    return R * (2 * Math.atan2(Math.sqrt(A), Math.sqrt(1 - A)));
}


// Цвет според близост до тайната област
function proximityColor(dist) {
    if (dist < 15) return "#00ff7f";      // много близо → зелено
    if (dist < 40) return "#a2ff00";      // близо → лайм
    if (dist < 80) return "#ffd000";      // средно → жълто
    if (dist < 140) return "#ff7700";     // далеч → оранжево
    return "#ff3333";                     // много далеч → червено
}


// Tooltip helpers
function showTooltip(e, text) {
    const t = document.getElementById("heatTooltip");
    const wrapper = document.querySelector(".map-wrapper");
    const rect = wrapper.getBoundingClientRect();

    t.style.display = "block";
    t.style.left = (e.clientX - rect.left + 15) + "px";
    t.style.top = (e.clientY - rect.top + 15) + "px";
    t.innerHTML = text;
}

function hideTooltip() {
    const t = document.getElementById("heatTooltip");
    if (t) t.style.display = "none";
}

// === POPUP ===
function showVictoryPopup(regionName) {
    const modal = document.getElementById("victoryModal");
    const regionSpan = document.getElementById("victoryRegion");
    regionSpan.textContent = regionName;
    modal.style.display = "flex";

    // Нова игра
    document.getElementById("newGameBtn").onclick = () => {
        modal.style.display = "none";
        location.reload();
    };
}
