// --- 2. تعريف متغيرات حالة اللعبة ---
let gameState = {
    playerCount: 2,
    playerNames: [],
    activePlayers: [], 
    currentPlayerIndex: 0,
    deck: [],
    playDirection: 1, 
    totalTurns: 0,
    questions: {},
    currentCard: null,
    forcedColor: null,
    
    // (جديد) متغيرات المؤقت
    timerDuration: 30, // 30 ثانية افتراضي
    timerId: null,      // لحفظ معرّف المؤقت (setInterval)
    timeLeft: 0,        // الوقت المتبقي بالثواني
    isPaused: false
};

// --- 3. ربط عناصر الواجهة (DOM Elements) ---
const screens = {
    setup: document.getElementById('setup-screen'),
    names: document.getElementById('names-screen'),
    passDevice: document.getElementById('pass-device-screen'),
    game: document.getElementById('game-screen'),
    gameOver: document.getElementById('game-over-screen'),
    pause: document.getElementById('pause-screen') // (جديد)
};

// (جديد) أزرار التحكم العلوية
const gameControls = document.getElementById('game-controls');
const pauseBtn = document.getElementById('pause-btn');
const exitBtn = document.getElementById('exit-btn');

// (جديد) شاشة الإعداد (المؤقت)
const timerSelectDisplay = document.getElementById('timer-select-display');
const incrementTimerBtn = document.getElementById('increment-timer');
const decrementTimerBtn = document.getElementById('decrement-timer');
const timerSteps = [0, 10, 15, 20, 30, 40, 50, 60]; // الخطوات الممكنة
let currentTimerStep = 4; // (يشير إلى 30 ثانية)

const playerCountDisplay = document.getElementById('player-count-display');
const incrementPlayersBtn = document.getElementById('increment-players');
const decrementPlayersBtn = document.getElementById('decrement-players');
const setupNextBtn = document.getElementById('setup-next-btn');

const playerNamesInputsContainer = document.getElementById('player-names-inputs');
const startGameBtn = document.getElementById('start-game-btn');

const passDeviceTitle = document.getElementById('pass-device-title');
const showCardBtn = document.getElementById('show-card-btn');

// (جديد) شاشة اللعب (المؤقت)
const timerContainer = document.getElementById('timer-container');
const timerBar = document.getElementById('timer-bar');

const cardContainer = document.getElementById('card-container');
const deckCounter = document.getElementById('deck-counter');
const endTurnBtn = document.getElementById('end-turn-btn');
const playAgainBtn = document.getElementById('play-again-btn');

const flipCardBtn = document.getElementById('flip-card-btn');
const cardFlipper = document.getElementById('card-flipper');
const cardFront = document.querySelector('.card-front');

const wildColorPicker = document.getElementById('wild-color-picker');
const wildColorButtons = document.querySelectorAll('.wild-btn');

const gameOverTitle = document.querySelector('#game-over-screen .modal-title');
const gameOverMessage = document.querySelector('#game-over-screen p');

// (جديد) شاشة الإيقاف
const resumeBtn = document.getElementById('resume-btn');
const exitGameConfirmBtn = document.getElementById('exit-game-confirm-btn');


const ACTION_MESSAGES = {
    'skip': "تخطي الدور! اللاعب التالي يفقد دوره.",
    'reverse': "عكس الاتجاه! اتجاه اللعب ينعكس الآن.",
    'draw2': "اسحب +2! اللاعب التالي يجاوب على سؤالين ويخسر دوره.",
    'wild': "وايلد كارد! اختر لون السؤال التالي.",
    'bomb': "قنبلة! 💣 اللاعب التالي يخرج من اللعبة!"
};

// --- 4. وظيفة التنقل بين الشاشات ---
function showScreen(screenId) {
    for (let id in screens) {
        if (screens[id]) {
            screens[id].classList.remove('active');
        }
    }
    if (screens[screenId]) {
        screens[screenId].classList.add('active');
    }

    // (جديد) إظهار أو إخفاء أزرار التحكم
    if (['passDevice', 'game'].includes(screenId)) {
        gameControls.classList.remove('hidden');
    } else {
        gameControls.classList.add('hidden');
    }
}

// --- 5. ربط الأحداث (Event Listeners) ---

// (أ) شاشة الإعداد (Setup)
incrementPlayersBtn.addEventListener('click', () => {
    if (gameState.playerCount < 6) {
        gameState.playerCount++;
        playerCountDisplay.textContent = gameState.playerCount;
    }
});
decrementPlayersBtn.addEventListener('click', () => {
    if (gameState.playerCount > 2) {
        gameState.playerCount--;
        playerCountDisplay.textContent = gameState.playerCount;
    }
});
// (جديد) أزرار المؤقت
incrementTimerBtn.addEventListener('click', () => {
    if (currentTimerStep < timerSteps.length - 1) {
        currentTimerStep++;
        gameState.timerDuration = timerSteps[currentTimerStep];
        timerSelectDisplay.textContent = gameState.timerDuration === 0 ? '∞' : gameState.timerDuration;
    }
});
decrementTimerBtn.addEventListener('click', () => {
     if (currentTimerStep > 0) {
        currentTimerStep--;
        gameState.timerDuration = timerSteps[currentTimerStep];
        timerSelectDisplay.textContent = gameState.timerDuration === 0 ? '∞' : gameState.timerDuration;
    }
});

setupNextBtn.addEventListener('click', () => {
    // (تعديل) حفظ مدة المؤقت
    gameState.timerDuration = timerSteps[currentTimerStep];
    console.log(`تم ضبط المؤقت على: ${gameState.timerDuration} ثواني`);
    createNameInputs(gameState.playerCount);
    showScreen('names');
});

// (ب) شاشة الأسماء (Names)
// ... (الكود كما هو - لا تغيير) ...
function createNameInputs(count) {
    playerNamesInputsContainer.innerHTML = ''; 
    for (let i = 0; i < count; i++) {
        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = `اسم اللاعب ${i + 1}`;
        input.className = 'player-name-input';
        playerNamesInputsContainer.appendChild(input);
    }
}
startGameBtn.addEventListener('click', () => {
    const nameInputs = document.querySelectorAll('.player-name-input');
    gameState.playerNames = Array.from(nameInputs).map((input, i) => input.value || `لاعب ${i + 1}`);
    resetGame();
});

// (ج) شاشة تمرير الجهاز (Pass Device)
showCardBtn.addEventListener('click', () => {
    drawAndDisplayCard();
    if (cardFlipper) {
        cardFlipper.classList.remove('flipped');
    }
    flipCardBtn.classList.remove('hidden');
    endTurnBtn.classList.add('hidden');
    wildColorPicker.classList.add('hidden'); 
    
    // (جديد) إخفاء المؤقت (سيظهر عند قلب الكرت)
    timerContainer.classList.add('hidden');
    
    showScreen('game');
});

// (د) زر "اقلب الكرت"
flipCardBtn.addEventListener('click', () => {
    if (cardFlipper) {
        cardFlipper.classList.add('flipped');
    }
    flipCardBtn.classList.add('hidden');
    
    // (جديد) بدء المؤقت
    startTimer();

    if (gameState.currentCard.value === 'wild') {
        wildColorPicker.classList.remove('hidden');
    
    } else if (gameState.currentCard.value === 'bomb') {
        applyCardAction(gameState.currentCard);
        endTurnBtn.classList.remove('hidden');

    } else {
        endTurnBtn.classList.remove('hidden');
    }
});

// (هـ) أزرار اختيار لون الوايلد
wildColorButtons.forEach(button => {
    button.addEventListener('click', () => {
        stopTimer(); // (جديد) إيقاف المؤقت
        gameState.forcedColor = button.dataset.color;
        wildColorPicker.classList.add('hidden');
        proceedToEndTurn();
    });
});


// (و) شاشة اللعب (Game Screen)
endTurnBtn.addEventListener('click', () => {
    stopTimer(); // (جديد) إيقاف المؤقت
    if (gameState.currentCard.value !== 'bomb') {
         applyCardAction(gameState.currentCard);
    }
    proceedToEndTurn();
});

// (ز) شاشة نهاية اللعبة (Game Over)
playAgainBtn.addEventListener('click', () => {
    gameState.playerCount = 2;
    playerCountDisplay.textContent = '2';
    // (تعديل) إعادة ضبط المؤقت الافتراضي
    currentTimerStep = 4; // 30 ثانية
    timerSelectDisplay.textContent = '30';
    gameState.timerDuration = 30;
    
    gameOverTitle.textContent = "انتهت الكروت!";
    gameOverMessage.textContent = "لقد أكملتم جميع الأسئلة. كانت جلسة رائعة!";
    showScreen('setup');
});

// (جديد!) (ح) أزرار التحكم العلوية وشاشة الإيقاف
pauseBtn.addEventListener('click', pauseGame);
exitBtn.addEventListener('click', pauseGame); // كلاهما يفتح شاشة الإيقاف

resumeBtn.addEventListener('click', resumeGame);
exitGameConfirmBtn.addEventListener('click', exitGame);


// --- 6. منطق اللعبة الأساسي ---

function proceedToEndTurn() {
    if (checkWinCondition()) return;
    const playerCount = gameState.playerNames.length;
    let nextPlayerIndex = gameState.currentPlayerIndex;
    do {
        nextPlayerIndex = (nextPlayerIndex + gameState.playDirection + playerCount) % playerCount;
    } while (!gameState.activePlayers[nextPlayerIndex].active); 
    gameState.currentPlayerIndex = nextPlayerIndex;
    if (checkWinCondition()) return;
    passDeviceTitle.textContent = `الدور على: ${gameState.playerNames[gameState.currentPlayerIndex]}`;
    showScreen('passDevice');
}

function checkWinCondition() {
    const activePlayersList = gameState.activePlayers.filter(player => player.active);
    if (activePlayersList.length === 1) {
        const winner = activePlayersList[0];
        gameOverTitle.textContent = "لدينا فائز!";
        gameOverMessage.textContent = `تهانينا لـ ${winner.name}! لقد نجوت من كل القنابل!`;
        showScreen('gameOver');
        return true;
    } else if (activePlayersList.length === 0) {
        gameOverTitle.textContent = "تعادل!";
        gameOverMessage.textContent = "تم إقصاء جميع اللاعبين!";
        showScreen('gameOver');
        return true;
    }
    return false;
}

function resetGame() {
    gameState.currentPlayerIndex = 0;
    gameState.playDirection = 1;
    gameState.totalTurns = 0;
    gameState.deck = [];
    gameState.forcedColor = null;
    gameState.isPaused = false;
    stopTimer(); // (جديد) التأكد من إيقاف أي مؤقت قديم
    
    gameState.activePlayers = gameState.playerNames.map((name, index) => ({
        index: index,
        name: name,
        active: true 
    }));
    
    buildDeck();
    shuffleDeck();

    passDeviceTitle.textContent = `الدور على: ${gameState.playerNames[0]}`;
    showScreen('passDevice');
}

async function fetchQuestions() {
    try {
        const response = await fetch(`assets/data/questions.json?v=${new Date().getTime()}`);
        if (!response.ok) { throw new Error('فشل تحميل ملف الأسئلة!'); }
        gameState.questions = await response.json();
    } catch (error) {
        console.error(error);
        alert('خطأ فادح: لم يتم تحميل بنك الأسئلة. الرجاء تحديث الصفحة.');
    }
}

function buildDeck() {
    // ... (الكود كما هو - لا تغيير) ...
    gameState.deck = []; const colors = ['red', 'blue', 'green', 'yellow']; const actions = ['skip', 'reverse', 'draw2']; const wilds = ['wild', 'bomb'];
    for (const color of colors) {
        gameState.deck.push({ type: 'number', color: color, value: '0' });
        for (let i = 1; i <= 9; i++) {
            gameState.deck.push({ type: 'number', color: color, value: i.toString() }); gameState.deck.push({ type: 'number', color: color, value: i.toString() });
        }
        for (const action of actions) {
            gameState.deck.push({ type: 'action', color: color, value: action }); gameState.deck.push({ type: 'action', color: color, value: action });
        }
    }
    for (let i = 0; i < 4; i++) {
        gameState.deck.push({ type: 'wild', color: 'black', value: 'wild' }); gameState.deck.push({ type: 'wild', color: 'black', value: 'bomb' });
    }
}

function shuffleDeck() {
    // ... (الكود كما هو - لا تغيير) ...
    for (let i = gameState.deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [gameState.deck[i], gameState.deck[j]] = [gameState.deck[j], gameState.deck[i]];
    }
}

function drawAndDisplayCard() {
    if (checkWinCondition()) return;
    if (gameState.deck.length === 0) {
        gameOverTitle.textContent = "انتهت الكروت!";
        gameOverMessage.textContent = "لم يتم إقصاء الجميع. أنتم أقوياء!";
        showScreen('gameOver');
        return;
    }
    const card = gameState.deck.pop();
    gameState.currentCard = card; 
    gameState.totalTurns++;
    const cardElement = createCardElement(card);
    cardFront.innerHTML = ''; 
    cardFront.appendChild(cardElement);
}

function applyCardAction(card) {
    const playerCount = gameState.playerNames.length;
    if (card.value === 'reverse') {
        gameState.playDirection *= -1;
    } else if (card.value === 'skip') {
        gameState.currentPlayerIndex = (gameState.currentPlayerIndex + gameState.playDirection + playerCount) % playerCount;
    } else if (card.value === 'draw2') {
        gameState.currentPlayerIndex = (gameState.currentPlayerIndex + gameState.playDirection + playerCount) % playerCount;
    } else if (card.value === 'bomb') {
        let targetPlayer = null;
        let searchIndex = gameState.currentPlayerIndex;
        // (تعديل!) البحث عن لاعب نشط غير اللاعب الحالي
        let attempts = 0;
        do {
            searchIndex = (searchIndex + gameState.playDirection + playerCount) % playerCount;
            if (gameState.activePlayers[searchIndex].active && searchIndex !== gameState.currentPlayerIndex) {
                targetPlayer = gameState.activePlayers[searchIndex];
                break;
            }
            attempts++;
        } while (attempts < playerCount); // منع حلقة لا نهائية

        if (targetPlayer) {
            targetPlayer.active = false;
            console.log(`تم إقصاء اللاعب: ${targetPlayer.name}`);
            alert(`بوووم! 💣 تم إقصاء اللاعب ${targetPlayer.name} من اللعبة!`);
        }
    }
}

function createCardElement(card) {
    // ... (الكود كما هو - لا تغيير) ...
    const cardDiv = document.createElement('div');
    cardDiv.className = `neo-card card-${card.color}`; 
    let question = '';
    let cornerIconSrc = '';
    if (card.type === 'number') {
        const colorToUse = gameState.forcedColor || card.color;
        const questionBank = gameState.questions[colorToUse] || gameState.questions['green'];
        question = questionBank[Math.floor(Math.random() * questionBank.length)];
        cornerIconSrc = `assets/images/num-${card.value}.png`; 
        if (gameState.forcedColor) { gameState.forcedColor = null; }
    } else if (card.type === 'action') {
        question = ACTION_MESSAGES[card.value];
        cornerIconSrc = `assets/images/icon-${card.value}.png`;
    } else if (card.type === 'wild') {
        question = ACTION_MESSAGES[card.value];
        cornerIconSrc = `assets/images/icon-${card.value}.png`;
    }
    cardDiv.innerHTML = `
        <div class="card-corner top-left">
            ${cornerIconSrc ? `<img src="${cornerIconSrc}" alt="${card.value}">` : ''}
        </div>
        <div class="card-content-box pixel-speech-box">
            <p class="card-question">${question}</p>
        </div>
        <div class="card-corner bottom-right">
            ${cornerIconSrc ? `<img src="${cornerIconSrc}" alt="${card.value}">` : ''}
        </div>
    `;
    return cardDiv;
}


// --- 7. (جديد!) منطق المؤقت والإيقاف ---

function startTimer() {
    // 1. لا تبدأ المؤقت إذا كان 0 (بدون مؤقت)
    if (gameState.timerDuration === 0) {
        timerContainer.classList.add('hidden');
        return;
    }
    
    // 2. إظهار وإعادة ضبط المؤقت
    timerContainer.classList.remove('hidden');
    timerBar.style.width = '100%';
    timerBar.style.transition = `width ${gameState.timerDuration}s linear`; // أنيميشن ناعم
    
    // (للدقة، سنستخدم JS لتحديث النسبة المئوية)
    timerBar.style.transition = 'width 0.1s linear'; // تحديث ناعم
    gameState.timeLeft = gameState.timerDuration;
    
    // 3. إيقاف أي مؤقت قديم
    stopTimer();

    // 4. بدء المؤقت الجديد (يتم تحديثه كل 100 ملي ثانية)
    gameState.timerId = setInterval(() => {
        if (gameState.isPaused) return; // توقف إذا كانت اللعبة متوقفة

        gameState.timeLeft -= 0.1;
        updateTimerBar();

        if (gameState.timeLeft <= 0) {
            console.log("انتهى الوقت!");
            stopTimer();
            // (إنهاء الدور تلقائياً)
            // (سنطبق الأكشن أولاً، كعقاب على التأخير)
            applyCardAction(gameState.currentCard);
            proceedToEndTurn();
        }
    }, 100);
}

function stopTimer() {
    clearInterval(gameState.timerId);
    gameState.timerId = null;
}

function updateTimerBar() {
    const percentage = (gameState.timeLeft / gameState.timerDuration) * 100;
    timerBar.style.width = `${percentage}%`;
    
    // (تغيير اللون للتحذير)
    if (percentage < 25) {
        timerBar.style.backgroundColor = 'var(--color-red)';
    } else if (percentage < 60) {
        timerBar.style.backgroundColor = 'var(--color-yellow)';
    } else {
        timerBar.style.backgroundColor = 'var(--color-green)';
    }
}

function pauseGame() {
    gameState.isPaused = true;
    showScreen('pause');
    // (المؤقت سيتوقف تلقائياً لأنه يتحقق من isPaused)
}

function resumeGame() {
    gameState.isPaused = false;
    showScreen('game');
    // (المؤقت سيكمل تلقائياً)
}

function exitGame() {
    stopTimer();
    gameState.isPaused = false;
    // (إعادة ضبط كل شيء والعودة للبداية)
    gameState.playerCount = 2;
    playerCountDisplay.textContent = '2';
    currentTimerStep = 4; // 30 ثانية
    timerSelectDisplay.textContent = '30';
    gameState.timerDuration = 30;
    showScreen('setup');
}


// --- 8. تشغيل اللعبة ---
fetchQuestions().then(() => {
    // إظهار شاشة الإعداد الافتراضية أولاً
    // (ملاحظة: الكود القديم `showScreen('setup')` تم نقله إلى هنا)
    timerSelectDisplay.textContent = timerSteps[currentTimerStep] === 0 ? '∞' : timerSteps[currentTimerStep];
    showScreen('setup'); 
});
