(function () {
    const username = '@Context.Session.GetString("Username")';
    const flagEl = document.getElementById('flag');
    const msgEl = document.getElementById('message');
    const scoreEl = document.getElementById('score');
    const timerEl = document.getElementById('timer');
    const answerInput = document.getElementById('answer');
    const checkBtn = document.getElementById('checkBtn');
    const nextBtn = document.getElementById('nextBtn');
    const leaderboardEl = document.getElementById('leaderboard');

    let countries = [];
    let current = null;
    let score = 0;
    let timeLeft = 15;
    let timerInterval = null;
    let xpGivenThisRound = false;
    let levelUpActive = false; 
    const jsConfetti = new JSConfetti();

    const correctSound = new Audio("/sound/correct.mp3");
    const wrongSound = new Audio("/sound/fail.mp3");

    async function loadLeaderboard() {
        try {
            const res = await fetch('/Auth/Leaderboard');
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
            leaderboardEl.innerHTML = `<hr style='margin:8px 0;'>${top || "<i>No records yet.</i>"}`;
        } catch (err) {
            console.error('Leaderboard error:', err);
        }
    }

    async function updateScore() {
        if (!username) return;
        try {
            await fetch('/Auth/UpdateScore', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: `score=${encodeURIComponent(score)}`
            });
        } catch (err) {
            console.error('Score update failed:', err);
        }
    }

    function startTimer() {
        clearInterval(timerInterval);
        timeLeft = 15;
        updateTimerDisplay();

        timerInterval = setInterval(() => {
            timeLeft--;
            updateTimerDisplay();
            if (timeLeft <= 0) {
                clearInterval(timerInterval);
                wrongSound.play();
                msgEl.innerHTML = `<span style='color:red;'>⏰ Time's up! It was ${current.name.common}</span>`;
                xpGivenThisRound = true;
                setTimeout(endGame, 1000);
            }
        }, 1000);
    }

    function updateTimerDisplay() {
        timerEl.textContent = `⏱️ Time: ${timeLeft}s`;
        if (timeLeft <= 5) timerEl.classList.add("low");
        else timerEl.classList.remove("low");
    }

    async function endGame() {
        clearInterval(timerInterval);
        if (username) await updateScore();
        msgEl.innerHTML = `<span style='color:red;'>Game Over! Final Score: ${score}</span>`;
        score = 0;
        scoreEl.innerText = `Score: ${score}`;
        xpGivenThisRound = false;
        setTimeout(nextQuestion, 1500);
        loadLeaderboard();
    }

    async function fetchCountries() {
        msgEl.innerHTML = `<span style="color:#666">Loading countries...</span>`;
        try {
            const region = (localStorage.getItem("region") || "all").trim();
            const res = await fetch('https://restcountries.com/v3.1/all?fields=name,flags,cca2,region');
            countries = await res.json();

            if (region.toLowerCase() !== "all") {
                countries = countries.filter(c =>
                    (c.region || "").toLowerCase() === region.toLowerCase()
                );
            }

            const excluded = ["åland islands", "svalbard and jan mayen"];
            countries = countries.filter(c => !excluded.includes((c.name?.common || "").toLowerCase()));

            if (!countries.length) {
                msgEl.innerHTML = `<span style="color:red;">No countries found for region: ${region}</span>`;
            } else {
                msgEl.innerHTML = `<span style="color:green;">Loaded ${countries.length} countries (${region.toUpperCase()} MODE)</span>`;
                nextQuestion();
            }

            loadLeaderboard();
        } catch (err) {
            msgEl.innerHTML = `<span style="color:red;">Error loading countries!</span>`;
            console.error(err);
        }
    }

    function pickRandom() {
        return countries[Math.floor(Math.random() * countries.length)];
    }

    function showCountry(c) {
        current = c;
        answerInput.value = '';
        msgEl.innerHTML = '';
        xpGivenThisRound = false;

        flagEl.classList.remove('visible');
        setTimeout(() => {
            flagEl.src = c.flags.png;
            flagEl.onload = () => flagEl.classList.add('visible');
        }, 250);

        startTimer();
    }

    function nextQuestion() {
        clearInterval(timerInterval);
        if (!countries.length) return;
        showCountry(pickRandom());
    }

    async function checkAnswer() {
        if (!current) return;
        clearInterval(timerInterval);

        const userAnswer = answerInput.value.trim().toLowerCase();
        const correct = (current.name?.common || '').toLowerCase();

        if (userAnswer === correct) {
            correctSound.play();
            score++;
            msgEl.innerHTML = `<span style='color:green;'>✅ Correct! ${current.name.common}</span>`;
            scoreEl.innerText = `Score: ${score}`;

            if (!xpGivenThisRound && username) {
                xpGivenThisRound = true;
                try {
                    const response = await fetch('/Auth/UpdateXP', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                        body: 'xpGained=1'
                    });
                    const data = await response.json();
                    if (data.isLevelUp) triggerLevelUpEffect(data.level);
                } catch (err) {
                    console.error('XP update failed:', err);
                }
            }

            setTimeout(nextQuestion, 1000);
        } else {
            wrongSound.play();
            msgEl.innerHTML = `<span style='color:red;'>❌ Wrong — ${current.name.common}</span>`;
            xpGivenThisRound = true;
            setTimeout(endGame, 1000);
        }
    }

    function triggerLevelUpEffect(newLevel) {
        if (levelUpActive) return;
        levelUpActive = true;

        jsConfetti.addConfetti({
            emojis: ['🎉'],
            confettiNumber: 100,
            emojiSize: 32,
            confettiRadius: 4,
            spread: 70
        });

        const popup = document.createElement('div');
        popup.className = 'level-up-popup';
        popup.innerHTML = `LEVEL UP!<br>⭐ Level ${newLevel}`;
        document.body.appendChild(popup);

        setTimeout(() => {
            popup.remove();
            levelUpActive = false;
        }, 2500);
    }

    checkBtn.addEventListener('click', checkAnswer);
    nextBtn.addEventListener('click', nextQuestion);
    answerInput.addEventListener('keydown', e => e.key === 'Enter' && checkAnswer());

    fetchCountries();
})();
