(function () {
    const username = '@Context.Session.GetString("Username")';
    const capitalEl = document.getElementById('capitalName');
    const msgEl = document.getElementById('message');
    const scoreEl = document.getElementById('score');
    const timerEl = document.getElementById('timer');
    const nextBtn = document.getElementById('nextBtn');
    const optionsEl = document.getElementById('options');
    const optionBtns = Array.from(document.querySelectorAll('.option-btn'));
    const leaderboardEl = document.getElementById('leaderboard');

    let countries = [];
    let current = null;                 // текущата държава (правилна)
    let options = [];                   // 4-те опции (низове с имена на държави)
    let correctIndex = -1;              // индекс на верния отговор в options
    let score = 0;
    let timeLeft = 15;
    let timerInterval = null;
    let xpGivenThisRound = false;       // предотвратява двойно XP за въпроса
    let answeringLocked = false;        // блокира кликове след избор
    let levelUpActive = false;

    const jsConfetti = new JSConfetti();
    const correctSound = new Audio("/sound/correct.mp3");
    const wrongSound = new Audio("/sound/fail.mp3");

    // ===== Leaderboard =====
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

    // ===== Score към сървъра (best score) =====
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

    // ===== Таймер =====
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
                revealCorrect();
                msgEl.innerHTML = `<span style='color:red;'>⏰ Time's up! Correct: ${current.name.common}</span>`;
                xpGivenThisRound = true;
                answeringLocked = true;
                setTimeout(endGame, 1000);
            }
        }, 1000);
    }

    function updateTimerDisplay() {
        timerEl.textContent = `⏱️ Time: ${timeLeft}s`;
        if (timeLeft <= 5) timerEl.classList.add("low");
        else timerEl.classList.remove("low");
    }

    // ===== Край на рунда =====
    async function endGame() {
        clearInterval(timerInterval);
        if (username) await updateScore();
        msgEl.innerHTML = `<span style='color:red;'>Game Over! Final Score: ${score}</span>`;
        score = 0;
        scoreEl.innerText = `Score: ${score}`;
        xpGivenThisRound = false;
        answeringLocked = false;
        setTimeout(nextQuestion, 1200);
        loadLeaderboard();
    }

    // ===== Зареждане на държави =====
    async function fetchCountries() {
        msgEl.innerHTML = `<span style="color:#666">Loading countries...</span>`;
        try {
            const region = (localStorage.getItem("region") || "all").trim();
            const res = await fetch('https://restcountries.com/v3.1/all?fields=name,capital,region');
            countries = await res.json();

            // Само държави със столица
            countries = countries.filter(c => Array.isArray(c.capital) && c.capital.length > 0);

            // Филтър по регион (ако не е "all")
            if (region.toLowerCase() !== "all") {
                countries = countries.filter(c =>
                    (c.region || "").toLowerCase() === region.toLowerCase()
                );
            }

            // Изключения
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

    // ===== Помощни =====
    function pickRandom(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    }

    function shuffleInPlace(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }

    function buildOptions(correctCountry, pool) {
        const correctName = correctCountry.name.common;
        // 3 различни грешни от същия регион ако може, иначе от целия списък
        const sameRegion = pool.filter(c => c.region === correctCountry.region && c.name.common !== correctName);
        const source = sameRegion.length >= 3 ? sameRegion : pool.filter(c => c.name.common !== correctName);

        const distractors = new Set();
        while (distractors.size < 3 && distractors.size < source.length) {
            distractors.add(pickRandom(source).name.common);
        }
        const arr = [correctName, ...Array.from(distractors).slice(0, 3)];
        return shuffleInPlace(arr);
    }

    function renderOptions(optionNames) {
        optionBtns.forEach((btn, idx) => {
            btn.disabled = false;
            btn.classList.remove('correct', 'wrong');
            btn.textContent = `${String.fromCharCode(65 + idx)}) ${optionNames[idx]}`;
        });
    }

    function revealCorrect() {
        optionBtns.forEach((btn, idx) => {
            if (idx === correctIndex) btn.classList.add('correct');
        });
    }

    // ===== Показване на въпрос =====
    function showQuestion() {
        // избираме държава
        current = pickRandom(countries);
        const capitalName = current.capital[0];

        // правим 4-те опции
        options = buildOptions(current, countries);
        correctIndex = options.findIndex(n => n === current.name.common);

        // визуализация
        capitalEl.textContent = capitalName;
        msgEl.innerHTML = '';
        xpGivenThisRound = false;
        answeringLocked = false;

        renderOptions(options);
        startTimer();
    }

    function nextQuestion() {
        clearInterval(timerInterval);
        if (!countries.length) return;
        showQuestion();
    }

    // ===== Логика при избор =====
    async function handleChoice(idx) {
        if (answeringLocked || current == null) return;
        answeringLocked = true;
        clearInterval(timerInterval);

        const chosen = options[idx];
        const isCorrect = (idx === correctIndex);

        if (isCorrect) {
            correctSound.play();
            optionBtns[idx].classList.add('correct');
            score++;
            scoreEl.innerText = `Score: ${score}`;
            msgEl.innerHTML = `<span style='color:green;'>✅ Correct! ${current.name.common}</span>`;

            // XP само веднъж за въпроса
            if (!xpGivenThisRound && username) {
                xpGivenThisRound = true;
                try {
                    const response = await fetch('/Auth/UpdateXP', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                        body: 'xpGained=1'
                    });
                    // Ако бекендът връща isLevelUp, показваме конфети
                    let data = null;
                    try { data = await response.json(); } catch { }
                    if (data && data.isLevelUp) triggerLevelUpEffect(data.level);
                } catch (err) {
                    console.error('XP update failed:', err);
                }
            }

            setTimeout(nextQuestion, 1000);
        } else {
            wrongSound.play();
            optionBtns[idx].classList.add('wrong');
            revealCorrect();
            msgEl.innerHTML = `<span style='color:red;'>❌ Wrong — Correct: ${current.name.common}</span>`;
            xpGivenThisRound = true;
            setTimeout(endGame, 1000);
        }

        // изключваме всички бутони след избор
        optionBtns.forEach(b => b.disabled = true);
    }

    // ===== Нотификация при Level Up =====
    function triggerLevelUpEffect(newLevel) {
        if (levelUpActive) return;
        levelUpActive = true;

        jsConfetti.addConfetti({
            emojis: ['✨'],
            confettiNumber: 120,
            emojiSize: 28,
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

    // ===== Слушатели =====
    optionsEl.addEventListener('click', (e) => {
        const btn = e.target.closest('.option-btn');
        if (!btn) return;
        const idx = Number(btn.dataset.index);
        handleChoice(idx);
    });

    nextBtn.addEventListener('click', nextQuestion);

    // Старт
    fetchCountries();
})();
