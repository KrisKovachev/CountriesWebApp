(function () {
    const username = '@Context.Session.GetString("Username")';

    const msgEl = document.getElementById('message');
    const scoreEl = document.getElementById('score');
    const cards = document.querySelectorAll('.flag-card');
    const countryNameEl = document.getElementById("countryName");
    const timerEl = document.getElementById("timer");
    const leaderboardEl = document.getElementById("leaderboard");

    let countries = [];
    let currentCorrect = null;
    let score = 0;
    let xpGivenThisRound = false;
    let timeLeft = 15;
    let timerInterval = null;

    const correctSound = new Audio("/sound/correct.mp3");
    const wrongSound = new Audio("/sound/fail.mp3");

    // ================================
    //  ACHIEVEMENTS UNLOCK FUNCTION
    // ================================
    function unlockAchievement(code) {
        console.log("Trying to unlock achievement:", code);

        fetch('/Achievements/Unlock?code=' + encodeURIComponent(code), {
            method: 'POST'
        })
            .then(r => {
                console.log("Unlock response status:", r.status);
                if (!r.ok) {
                    console.warn("Unlock failed, status:", r.status);
                }
                return r.json();
            })
            .then(data => {
                console.log("Unlock JSON:", data);
                if (!data || !data.unlocked) {
                    return;
                }

                const popup = document.getElementById('achievementPopup');
                const text = document.getElementById('achievementText');

                if (!popup || !text) {
                    console.warn("Achievement popup elements not found!");
                    return;
                }

                text.innerText = code;
                popup.classList.add('show');

                setTimeout(() => popup.classList.remove('show'), 4000);
            })
            .catch(err => {
                console.error("Unlock error:", err);
            });
    }

    // ===========================================
    //         LOAD LEADERBOARD FROM SERVER
    // ===========================================
    async function loadLeaderboard() {
        try {
            const res = await fetch('/Auth/FlagQuizLeaderboard');
            const data = await res.json();

            const top = data.map((p, i) =>
                `<div class="leaderboard-entry">
                <span class="rank-num">⭐ ${i + 1}.</span>
                <img src="${p.badgeImage}" class="badge-icon" alt="Badge">
                <b class="player-name">${p.username}</b>
                — ${p.bestScore} pts
                <span class="player-rank">(${p.rank})</span>
            </div>`
            ).join('');

            leaderboardEl.innerHTML = top || "<i>No records yet.</i>";
        } catch (err) {
            console.error("Leaderboard error:", err);
        }
    }

    // ===========================================
    //               UPDATE SCORE SERVER
    // ===========================================
    async function updateBestScore() {
        if (!username || score <= 0) return;

        try {
            await fetch('/Auth/UpdateFlagQuizScore', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: `score=${encodeURIComponent(score)}`
            });
        } catch (err) {
            console.error("Score update failed:", err);
        }
    }

    // ===========================================
    //                   TIMER
    // ===========================================
    function startTimer() {
        clearInterval(timerInterval);
        timeLeft = 15;
        updateTimerDisplay();

        timerInterval = setInterval(async () => {
            timeLeft--;
            updateTimerDisplay();

            if (timeLeft <= 0) {
                clearInterval(timerInterval);
                wrongSound.play();

                msgEl.innerHTML = `<span style='color:red;'>⏳ Time's up! Correct: ${currentCorrect.name.common}</span>`;

                await updateBestScore();
                await loadLeaderboard();

                // 🔥 ACHIEVEMENTS ON GAME OVER (TIME)
                if (score >= 50) unlockAchievement("FLAG_MASTER_1");
                if (score >= 80) unlockAchievement("FLAG_MASTER_2");
                if (score >= 100) unlockAchievement("FLAG_GOD");

                score = 0;
                scoreEl.textContent = "Score: 0";

                setTimeout(nextRound, 1200);
            }
        }, 1000);
    }

    function updateTimerDisplay() {
        timerEl.textContent = `⏱️ Time: ${timeLeft}s`;

        const isLow = timeLeft <= 5;

        timerEl.classList.toggle("low", isLow);

        cards.forEach(card => {
            card.classList.toggle("time-warning", isLow);
        });
    }

    // ===========================================
    //               LOAD COUNTRIES
    // ===========================================
    async function fetchCountries() {
        msgEl.innerHTML = `<span style="color:#666">Loading countries...</span>`;
        const region = (localStorage.getItem("region") || "all").trim();
        document.body.classList.add(region.toLowerCase());
        const res = await fetch('https://restcountries.com/v3.1/all?fields=name,flags,cca2,region');

        let all = await res.json();

        if (region.toLowerCase() !== "all") {
            all = all.filter(c =>
                (c.region || "").toLowerCase() === region.toLowerCase()
            );
        }

        countries = all;

        msgEl.innerHTML = `<span style="color:green;">Loaded ${countries.length} countries (${region.toUpperCase()})</span>`;

        await loadLeaderboard();
        nextRound();
    }

    function pickRandom() {
        return countries[Math.floor(Math.random() * countries.length)];
    }

    // ===========================================
    //            GENERATE NEXT ROUND
    // ===========================================
    function nextRound() {
        msgEl.innerHTML = "";
        xpGivenThisRound = false;

        cards.forEach(card => {
            const img = card.querySelector("img");
            img.classList.remove("visible");
        });

        setTimeout(() => {

            currentCorrect = pickRandom();
            countryNameEl.textContent = currentCorrect.name.common;
            countryNameEl.classList.remove("visible");
            setTimeout(() => {
                countryNameEl.textContent = currentCorrect.name.common;
                countryNameEl.classList.add("visible");
            }, 50);

            const wrongs = [];
            while (wrongs.length < 3) {
                const c = pickRandom();
                if (c.name.common !== currentCorrect.name.common) wrongs.push(c);
            }

            const options = [currentCorrect, ...wrongs].sort(() => Math.random() - 0.5);

            cards.forEach((card, i) => {
                const img = card.querySelector("img");

                card.dataset.correct = options[i].name.common === currentCorrect.name.common;

                img.src = options[i].flags.png;

                setTimeout(() => {
                    card.classList.remove("fade-out");
                    img.classList.add("visible");
                }, 50);
            });

            startTimer();

        }, 200);
    }

    // ===========================================
    //             Dark Mode Toggle
    // ===========================================
    const darkBtn = document.getElementById("darkModeToggle");
    if (darkBtn) {
        if (localStorage.getItem("darkMode") === "on") {
            document.body.classList.add("dark-mode");
            darkBtn.textContent = "☀️ Light Mode";
        }

        darkBtn.addEventListener("click", () => {
            document.body.classList.toggle("dark-mode");

            const enabled = document.body.classList.contains("dark-mode");
            localStorage.setItem("darkMode", enabled ? "on" : "off");

            darkBtn.textContent = enabled ? "☀️ Light Mode" : "🌙 Dark Mode";
        });
    }

    // ===========================================
    //             HANDLE FLAG CLICK
    // ===========================================
    async function handleChoice(card) {
        clearInterval(timerInterval);

        const isCorrect = (card.dataset.correct === "true");

        if (isCorrect) {
            card.classList.add("correct");
            setTimeout(() => card.classList.remove("correct"), 500);
            correctSound.play();
            score++;
            scoreEl.textContent = `Score: ${score}`;

            if (!xpGivenThisRound && username) {
                xpGivenThisRound = true;

                await fetch('/Auth/UpdateXP', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: 'xpGained=1'
                });
            }

            msgEl.innerHTML = `<span style='color:green;'>✔ Correct!</span>`;
            setTimeout(() => {
                card.classList.remove("correct");
                nextRound();
            }, 650);
        }
        else {
            card.classList.add("wrong");
            setTimeout(() => card.classList.remove("wrong"), 500);

            cards.forEach(c => {
                if (c.dataset.correct === "true") {
                    c.classList.add("reveal");
                    setTimeout(() => c.classList.remove("reveal"), 650);
                }
            });

            wrongSound.play();
            msgEl.innerHTML = `<span style='color:red;'>❌ Wrong — ${currentCorrect.name.common}</span>`;

            await updateBestScore();
            await loadLeaderboard();

            // 🔥 ACHIEVEMENTS ON GAME OVER (WRONG)
            if (score >= 50) unlockAchievement("FLAG_MASTER_1");
            if (score >= 80) unlockAchievement("FLAG_MASTER_2");
            if (score >= 100) unlockAchievement("FLAG_GOD");

            score = 0;
            scoreEl.textContent = "Score: 0";

            setTimeout(() => {
                card.classList.remove("wrong");
                nextRound();
            }, 1100);
        }
    }

    cards.forEach(card =>
        card.addEventListener("click", () => handleChoice(card))
    );

    fetchCountries();
})();
