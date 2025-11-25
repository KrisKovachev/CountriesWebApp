// =============================================
// ACHIEVEMENT POPUP (Steam-like + Dark Glow UI)
// =============================================

// Mapping code -> Display name
const achievementNames = {
    "FLAG_MASTER_1": "Flag Master I",
    "FLAG_MASTER_2": "Flag Master II",
    "FLAG_GOD": "Flag God"
};

// Queue for achievements to show one by one
const achievementQueue = [];
let achievementShowing = false;

// Handles popup animation + queueing
function processAchievementQueue() {
    if (achievementShowing) return;
    if (achievementQueue.length === 0) return;

    achievementShowing = true;
    const code = achievementQueue.shift();

    const popup = document.getElementById('achievementPopup');
    const titleEl = document.getElementById('achievementText');

    if (!popup || !titleEl) {
        achievementShowing = false;
        return;
    }

    // Get readable name, fallback to code
    const displayName = achievementNames[code] || code;
    titleEl.textContent = displayName;

    // Show popup
    popup.classList.remove('hide');
    popup.classList.add('show');

    // Hide after 3.5 sec
    setTimeout(() => {
        popup.classList.add('hide');

        setTimeout(() => {
            popup.classList.remove('show');
            popup.classList.remove('hide');
            achievementShowing = false;

            // Continue queue
            processAchievementQueue();

        }, 300); // small delay for animation

    }, 3500);
}


// Main function called from games
function unlockAchievement(code) {
    console.log("Unlock achievement:", code);

    fetch('/Achievements/Unlock?code=' + encodeURIComponent(code), {
        method: 'POST'
    })
        .then(r => {
            if (!r.ok) {
                console.warn("Unlock failed, status:", r.status);
            }
            return r.json();
        })
        .then(data => {
            if (!data.unlocked) return;

            // Add to queue and show
            achievementQueue.push(code);
            processAchievementQueue();
        })
        .catch(err => console.error("Unlock error:", err));
}
