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
    forcedColor: null, // لون الوايلد
    turnsToPlay: 1,      // (جديد) لكرت +2
    
    timerDuration: 30, 
    timerId: null,      
    timeLeft: 0,        
    isPaused: false
};

// --- 3. ربط عناصر الواجهة (DOM Elements) ---
const screens = {
    setup: document.getElementById('setup-screen'),
    names: document.getElementById('names-screen'),
    passDevice: document.getElementById('pass-device-screen'),
    game: document.getElementById('game-screen'),
    gameOver: document.getElementById('game-over-screen'),
    pause: document.getElementById('pause-screen'),
    exitConfirm: document.getElementById('exit-confirm-screen'),   // (جديد)
    elimination: document.getElementById('elimination-screen') // (جديد)
};

const gameControls = document.getElementById('game-controls');
const pauseBtn = document.getElementById('pause-btn');
const exitBtn = document.getElementById('exit-btn');

const timerSelectDisplay = document.getElementById('timer-select-display');
const incrementTimerBtn = document.getElementById('increment-timer');
const decrementTimerBtn = document.getElementById('decrement-timer');
const timerSteps = [0, 10, 15, 20, 30, 40, 50, 60]; 
let currentTimerStep = 4; 

const playerCountDisplay = document.getElementById('player-count-display');
const incrementPlayersBtn = document.getElementById('increment-players');
const decrementPlayersBtn = document.getElementById('decrement-players');
const setupNextBtn = document.getElementById('setup-next-btn');

const playerNamesInputsContainer = document.getElementById('player-names-inputs');
const startGameBtn = document.getElementById('start-game-btn');

const passDeviceTitle = document.getElementById('pass-device-title');
const passDeviceMessage = document.getElementById('pass-device-message'); // (جديد)
const showCardBtn = document.getElementById('show-card-btn');

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

// (جديد) شاشات التأكيد
const resumeBtn = document.getElementById('resume-btn');
const exitConfirmYesBtn = document.getElementById('exit-confirm-yes-btn');
const exitConfirmNoBtn = document.getElementById('exit-confirm-no-btn');
const eliminationMessage = document.getElementById('elimination-message');
const eliminationOkBtn = document.getElementById('elimination-ok-btn');


const ACTION_MESSAGES = {
    'skip': "تخطي الدور! اللاعب التالي يفقد دوره.",
    'reverse': "عكس الاتجاه! اتجاه اللعب ينعكس الآن.",
    'draw2': "اسحب كرتين! عليك اللعب مرتين متتاليتين.", // (تعديل الرسالة)
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
    gameState.timerDuration = timerSteps[currentTimerStep];
    createNameInputs(gameState.playerCount);
    showScreen('names');
});

// (ب) شاشة الأسماء (Names)
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
    // 1. (تعديل!) سحب الكرت الصحيح (مع التحقق من الوايلد)
    drawAndDisplayCard(); 
    
    // 2. إعادة ضبط الكرت ليظهر الظهر
    if (cardFlipper) {
        cardFlipper.classList.remove('flipped');
    }
    
    // 3. إظهار/إخفاء الأزرار
    flipCardBtn.classList.remove('hidden');
    endTurnBtn.classList.add('hidden');
    wildColorPicker.classList.add('hidden'); 
    timerContainer.classList.add('hidden'); 
    
    // 4. الانتقال لشاشة اللعب
    showScreen('game');
});

// (د) زر "اقلب الكرت"
flipCardBtn.addEventListener('click', () => {
    if (cardFlipper) {
        cardFlipper.classList.add('flipped');
    }
    flipCardBtn.classList.add('hidden');
    
    // بدء المؤقت (سيتحقق إذا كان 0)
    startTimer();

    // (جديد!) تأخير ظهور الأزرار وتأثير القنبلة
    setTimeout(() => {
        if (gameState.isPaused) return; // لا تفعل شيئاً إذا أوقف اللاعب اللعبة

        if (gameState.currentCard.value === 'wild') {
            wildColorPicker.classList.remove('hidden');
        
        } else if (gameState.currentCard.value === 'bomb') {
            applyCardAction(gameState.currentCard); // تطبيق الإقصاء
            showScreen('elimination'); // إظهار شاشة الإقصاء
        
        } else if (gameState.currentCard.value === 'draw2') {
             applyCardAction(gameState.currentCard); // (لوضع العقوبة turnsToPlay = 2)
             endTurnBtn.classList.remove('hidden');
        
        } else {
            applyCardAction(gameState.currentCard); // (لتطبيق reverse/skip)
            endTurnBtn.classList.remove('hidden');
        }
    }, 600); // 600ms = مدة أنيميشن القلب
});

// (هـ) أزرار اختيار لون الوايلد
wildColorButtons.forEach(button => {
    button.addEventListener('click', () => {
        stopTimer(); 
        gameState.forcedColor = button.dataset.color;
        wildColorPicker.classList.add('hidden');
        proceedToEndTurn(); 
    });
});


// (و) زر "السؤال التالي"
endTurnBtn.addEventListener('click', () => {
    stopTimer(); 
    proceedToEndTurn();
});

// (جديد!) (ز) زر المتابعة من شاشة الإقصاء
eliminationOkBtn.addEventListener('click', () => {
    proceedToEndTurn();
});

// (ح) شاشة نهاية اللعبة (Game Over)
playAgainBtn.addEventListener('click', () => {
    gameState.playerCount = 2;
    playerCountDisplay.textContent = '2';
    currentTimerStep = 4; 
    timerSelectDisplay.textContent = '30';
    gameState.timerDuration = 30;
    
    gameOverTitle.textContent = "انتهت الكروت!";
    gameOverMessage.textContent = "لقد أكملتم جميع الأسئلة. كانت جلسة رائعة!";
    showScreen('setup');
});

// (تعديل!) (ط) أزرار التحكم العلوية وشاشات الإيقاف
pauseBtn.addEventListener('click', pauseGame);
exitBtn.addEventListener('click', () => {
    // زر الخروج يفتح شاشة تأكيد الخروج
    pauseGame(); // (يوقف المؤقت أولاً)
    showScreen('exitConfirm');
});
resumeBtn.addEventListener('click', resumeGame);
exitConfirmYesBtn.addEventListener('click', exitGame);
exitConfirmNoBtn.addEventListener('click', () => {
    // إذا ضغط "لا"، نعود للعبة (أو شاشة الإيقاف)
    resumeGame(); 
});


// --- 6. منطق اللعبة الأساسي ---

/** (تعديل!) وظيفة إنهاء الدور (تدعم +2) */
function proceedToEndTurn() {
    if (checkWinCondition()) return;
    
    // (جديد!) التحقق من عقوبة +2
    if (gameState.turnsToPlay > 1) {
        gameState.turnsToPlay--; // إنقاص العقوبة
        
        // إجبار اللاعب الحالي على اللعب مرة أخرى
        const currentPlayerName = gameState.playerNames[gameState.currentPlayerIndex];
        passDeviceTitle.textContent = `الدور على: ${currentPlayerName}`;
        passDeviceMessage.textContent = `دورك الإضافي (${gameState.turnsToPlay + 1}/2)! اضغط "أنا جاهز"`;
        showScreen('passDevice');
        return; // الخروج من الوظيفة (لا تنقل الدور)
    }
    
    // إذا لم يكن هناك عقوبة، ابحث عن اللاعب النشط التالي
    const playerCount = gameState.playerNames.length;
    let nextPlayerIndex = gameState.currentPlayerIndex;
    do {
        nextPlayerIndex = (nextPlayerIndex + gameState.playDirection + playerCount) % playerCount;
    } while (!gameState.activePlayers[nextPlayerIndex].active); 
    gameState.currentPlayerIndex = nextPlayerIndex;
    
    if (checkWinCondition()) return;

    passDeviceTitle.textContent = `الدور على: ${gameState.playerNames[gameState.currentPlayerIndex]}`;
    passDeviceMessage.textContent = 'مرر الجهاز للاعب التالي، ثم اضغط "أنا جاهز"!'; // إعادة الرسالة للأصل
    showScreen('passDevice');
}

function checkWinCondition() {
    const activePlayersList = gameState.activePlayers.filter(player => player.active);
    if (activePlayersList.length === 1) {
        const winner = activePlayersList[0];
        gameOverTitle.textContent = "لدينا فائز!";
        gameOverMessage.textContent = `تهانينا لـ ${winner.name}! لقد نجوت من كل القنابل!`;
        stopTimer();
        showScreen('gameOver');
        return true;
    } else if (activePlayersList.length === 0) {
        gameOverTitle.textContent = "تعادل!";
        gameOverMessage.textContent = "تم إقصاء جميع اللاعبين!";
        stopTimer();
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
    gameState.turnsToPlay = 1; // (جديد)
    stopTimer(); 
    
    gameState.activePlayers = gameState.playerNames.map((name, index) => ({
        index: index,
        name: name,
        active: true 
    }));
    
    buildDeck();
    shuffleDeck();

    passDeviceTitle.textContent = `الدور على: ${gameState.playerNames[0]}`;
    passDeviceMessage.textContent = 'مرر الجهاز للاعب التالي، ثم اضغط "أنا جاهز"!';
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

/** (جديد) البحث عن كرت باللون المطلوب (للويلد كارد) */
function findAndDrawForcedCard(color) {
    // البحث من نهاية الكومة (الأعلى)
    for (let i = gameState.deck.length - 1; i >= 0; i--) {
        if (gameState.deck[i].color === color) {
            // وجدنا الكرت! اسحبه
            const card = gameState.deck.splice(i, 1)[0]; // اسحبه من الكومة
            return card;
        }
    }
    // إذا لم نجد الكرت المطلوب، اسحب أي كرت عشوائي
    return gameState.deck.pop();
}

/** (تعديل!) سحب الكرت (يدعم الوايلد) */
function drawAndDisplayCard() {
    if (checkWinCondition()) return;
    if (gameState.deck.length === 0) {
        gameOverTitle.textContent = "انتهت الكروت!";
        gameOverMessage.textContent = "لم يتم إقصاء الجميع. أنتم أقوياء!";
        showScreen('gameOver');
        return;
    }

    let card;
    if (gameState.forcedColor) {
        // (جديد!) تم فرض لون من الوايلد
        card = findAndDrawForcedCard(gameState.forcedColor);
        gameState.forcedColor = null; // إعادة تعيين بعد السحب
    } else {
        // السحب العشوائي المعتاد
        card = gameState.deck.pop();
    }
    
    gameState.currentCard = card; 
    gameState.totalTurns++;
    const cardElement = createCardElement(card);
    cardFront.innerHTML = ''; 
    cardFront.appendChild(cardElement);
}

/** (تعديل!) تطبيق تأثيرات الكروت */
function applyCardAction(card) {
    const playerCount = gameState.playerNames.length;
    
    if (card.value === 'reverse') {
        gameState.playDirection *= -1;
    
    } else if (card.value === 'skip') {
        gameState.currentPlayerIndex = (gameState.currentPlayerIndex + gameState.playDirection + playerCount) % playerCount;
    
    } else if (card.value === 'draw2') {
        // (جديد!) تطبيق عقوبة +2
        gameState.turnsToPlay = 2; 
    
    } else if (card.value === 'bomb') {
        let targetPlayer = null;
        let searchIndex = gameState.currentPlayerIndex;
        let attempts = 0;
        
        // البحث عن اللاعب النشط التالي (غير اللاعب الحالي)
        do {
            searchIndex = (searchIndex + gameState.playDirection + playerCount) % playerCount;
            if (gameState.activePlayers[searchIndex].active && searchIndex !== gameState.currentPlayerIndex) {
                targetPlayer = gameState.activePlayers[searchIndex];
                break;
            }
            attempts++;
        } while (attempts < playerCount * 2); // منع حلقة لا نهائية

        if (targetPlayer) {
            targetPlayer.active = false;
            console.log(`تم إقصاء اللاعب: ${targetPlayer.name}`);
            // (جديد!) تحديث رسالة الإقصاء للشاشة
            eliminationMessage.textContent = `تم إقصاء اللاعب ${targetPlayer.name}!`;
        } else {
            // (حالة نادرة: لا يوجد لاعب لإقصائه؟)
            eliminationMessage.textContent = "القنبلة لم تصب أحداً!";
        }
    }
}

function createCardElement(card) {
    // ... (الكود كما هو - لا تغيير) ...
    // (المنطق القديم للـ forcedColor تم نقله إلى drawAndDisplayCard)
    const cardDiv = document.createElement('div');
    cardDiv.className = `neo-card card-${card.color}`; 
    let question = '';
    let cornerIconSrc = '';
    if (card.type === 'number') {
        const questionBank = gameState.questions[card.color] || gameState.questions['green'];
        question = questionBank[Math.floor(Math.random() * questionBank.length)];
        cornerIconSrc = `assets/images/num-${card.value}.png`; 
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


// --- 7. منطق المؤقت والإيقاف ---

function startTimer() {
    if (gameState.timerDuration === 0) {
        timerContainer.classList.add('hidden');
        return;
    }
    
    timerContainer.classList.remove('hidden'); // (تعديل! كان .active)
    timerContainer.classList.add('active'); // (إضافة .active لإظهاره)
    timerBar.style.transition = 'none'; // إزالة الأنيميشن القديم
    timerBar.style.width = '100%';
    gameState.timeLeft = gameState.timerDuration;
    
    stopTimer(); // إيقاف أي مؤقت قديم

    gameState.timerId = setInterval(() => {
        if (gameState.isPaused) return; 

        gameState.timeLeft -= 0.1;
        updateTimerBar();

        if (gameState.timeLeft <= 0) {
            console.log("انتهى الوقت!");
            stopTimer();
            // إنهاء الدور تلقائياً
            if (gameState.currentCard.value !== 'bomb') { // (لا تطبق القنبلة مرتين)
                 applyCardAction(gameState.currentCard);
            }
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
    // (تعديل!) إظهار شاشة الإيقاف فقط إذا لم تكن شاشة الخروج ظاهرة
    if (!screens.exitConfirm.classList.contains('active')) {
        showScreen('pause');
    }
}

function resumeGame() {
    gameState.isPaused = false;
    // (تعديل!) إخفاء شاشات التأكيد والعودة للعبة
    screens.pause.classList.remove('active');
    screens.exitConfirm.classList.remove('active');
    showScreen('game');
}

function exitGame() {
    stopTimer();
    gameState.isPaused = false;
    // (تعديل!) إخفاء الشاشات المنبثقة
    screens.pause.classList.remove('active');
    screens.exitConfirm.classList.remove('active');
    
    gameState.playerCount = 2;
    playerCountDisplay.textContent = '2';
    currentTimerStep = 4; 
    timerSelectDisplay.textContent = '30';
    gameState.timerDuration = 30;
    showScreen('setup');
}


// --- 8. تشغيل اللعبة ---
fetchQuestions().then(() => {
    timerSelectDisplay.textContent = timerSteps[currentTimerStep] === 0 ? '∞' : timerSteps[currentTimerStep];
    showScreen('setup'); 
});
