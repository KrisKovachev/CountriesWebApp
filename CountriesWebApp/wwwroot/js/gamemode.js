document.addEventListener("DOMContentLoaded", () => {
    const flagMode = document.getElementById("flagMode");
    const capitalMode = document.getElementById("capitalMode");
    const geoheatMode = document.getElementById("geoheatMode");

    flagMode.addEventListener("click", () => {
        localStorage.setItem("gameMode", "flag");
        window.location.href = "/Home/Menu"; 
    });

    capitalMode.addEventListener("click", () => {
        localStorage.setItem("gameMode", "capital");
        window.location.href = "/Home/Capital"; 
    });

    geoheatMode.addEventListener("click", () => {
        localStorage.setItem("gameMode", "geoheat");
        window.location.href = "/Home/GeoHeat";
    });
});
