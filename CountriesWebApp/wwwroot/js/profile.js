document.addEventListener("DOMContentLoaded", () => {
    const xpFill = document.querySelector(".xp-fill");
    const xpText = document.querySelector(".xp-text");
    const levelEl = document.querySelector(".level span");

    // Тази функция ще я извикваш след като потребителят получи ново XP или качи ниво.
    function updateXPBar(currentXP, requiredXP, level, leveledUp = false) {
        const percent = Math.min((currentXP / requiredXP) * 100, 100);
        xpFill.style.setProperty("--xp-width", `${percent}%`);
        xpText.textContent = `${currentXP} / ${requiredXP} XP`;
        levelEl.textContent = `⭐ ${level}`;

        if (leveledUp) {
            xpFill.classList.add("level-up");
            setTimeout(() => xpFill.classList.remove("level-up"), 1200);
        }
    }

    // 🧩 Примерна симулация – можеш да я изтриеш
    // updateXPBar(30, 50, 4); // нормално състояние
    // setTimeout(() => updateXPBar(10, 60, 5, true), 2500); // симулираме "level up"
});
