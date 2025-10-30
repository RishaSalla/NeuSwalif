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
    turnsToPlay: 1,      // 1 = دور عادي, 2 = عقوبة +2
    
    timerDuration: 0, // (تعديل!) 0 هو الافتراضي (∞)
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
    exitConfirm: document.getElementById('exit-confirm-screen'),   
    elimination: document.getElementById('elimination-screen') 
};

const gameControls = document.getElementById('game-controls');
const pauseBtn = document.getElementById('pause-btn');
const exitBtn = document.getElementById('exit-btn');

const timerSelectDisplay = document.getElementById('timer-select-display');
const incrementTimerBtn = document.getElementById('increment-timer');
const decrementTimerBtn = document.getElementById('decrement-timer');
const timerSteps = [0, 10, 15, 20, 30, 40, 50, 60]; 
let currentTimerStep = 0; // (تعديل!) الافتراضي هو 0 (∞)

const playerCountDisplay = document.getElementById('player-count-display');
const incrementPlayersBtn = document.getElementById('increment-players');
const decrementPlayersBtn = document.getElementById('decrement-players');
const setupNextBtn = document.getElementById('setup-next-btn');

const playerNamesInputsContainer = document.getElementById('player-names-inputs');
const startGameBtn = document.getElementById('start-game-btn');
const namesBackBtn = document.getElementById('names-back-btn'); // (جديد) زر الرجوع

const passDeviceTitle = document.getElementById('pass-device-title');
const passDeviceMessage = document.getElementById('pass-device-message'); 
const showCardBtn = document.getElementById('show-card-btn');

const timerContainer = document.getElementById('timer-container');
const timerBar = document.getElementById('timer-bar');

const cardContainer = document.getElementById('card-container');
const endTurnBtn = document.getElementById('end-turn-btn');
const playAgainBtn = document.getElementById('play-again-btn');

const flipCardBtn = document.getElementById('flip-card-btn');
const cardFlipper = document.getElementById('card-flipper');
const cardFront = document.querySelector('.card-front');

const wildColorPicker = document.getElementById('wild-color-picker');
const wildColorButtons = document.querySelectorAll('.wild-btn');

const gameOverTitle = document.querySelector('#game-over-screen .modal-title');
const gameOverMessage = document.querySelector('#game-over-screen p');

const resumeBtn = document.getElementById('resume-btn');
const exitConfirmYesBtn = document.getElementById('exit-confirm-yes-btn');
const exitConfirmNoBtn = document.getElementById('exit-confirm-no-btn');
const eliminationMessage = document.getElementById('elimination-message');
const eliminationOkBtn = document.getElementById('elimination-ok-btn');

const ACTION_MESSAGES = {
    'skip': "تخطي الدور! اللاعب التالي يفقد دوره.",
    'reverse': "عكس الاتجاه! اتجاه اللعب ينعكس الآن.",
    'draw2': "اسحب كرتين! 💣 اللاعب التالي سيلعب دورتين متتاليتين.",
    'wild': "وايلد كارد! اختر لون السؤال التالي.",
    'bomb': "قنبلة! 💣 اللاعب التالي يخرج من اللعبة!"
};

// --- 4. وظيفة التنقل بين الشاشات ---
function showScreen(screenId) {
    // إخفاء جميع الشاشات المنبثقة أولاً
    Object.values(screens).forEach(screen => {
        // (تعديل!) التعامل مع الشاشات التي هي ليست شاشات رئيسية
        if (screen) screen.classList.remove('active');
    });
    
    // إظهار الشاشة المطلوبة
    if (screens[screenId]) {
        screens[screenId].classList.add('active');
    }

    // إظهار/إخفاء أزرار التحكم
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
// (جديد!) زر الرجوع
namesBackBtn.addEventListener('click', () => {
    showScreen('setup');
});

// (ج) شاشة تمرير الجهاز (Pass Device)
showCardBtn.addEventListener('click', () => {
    drawAndDisplayCard(); 
    if (cardFlipper) {
        cardFlipper.classList.remove('flipped');
    }
    // (تعديل!) إظهار/إخفاء الأزرار لتوحيد المكان
    flipCardBtn.classList.remove('hidden');
    endTurnBtn.classList.add('hidden');
    wildColorPicker.classList.add('hidden'); 
    
    timerContainer.classList.remove('active'); // إخفاء المؤقت
    
    showScreen('game');
});

// (د) زر "اقلب الكرت"
flipCardBtn.addEventListener('click', () => {
    if (cardFlipper) {
        cardFlipper.classList.add('flipped');
    }
    flipCardBtn.classList.add('hidden');
    
    startTimer();

    // تأخير ظهور الأزرار وتأثير القنبلة (لإصلاح الخطأ #8)
    setTimeout(() => {
        if (gameState.isPaused) return; 

        if (gameState.currentCard.value === 'wild') {
            wildColorPicker.classList.remove('hidden');
        
        } else if (gameState.currentCard.value === 'bomb') {
            applyCardAction(gameState.currentCard); // تطبيق الإقصاء
            showScreen('elimination'); // إظهار شاشة الإقصاء
        
        } else {
             applyCardAction(gameState.currentCard); // (لتطبيق +2, skip, reverse)
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


// (و) زر "التالي" (إنهاء الدور)
endTurnBtn.addEventListener('click', () => {
    stopTimer(); 
    proceedToEndTurn();
});

// (ز) زر المتابعة من شاشة الإقصاء
eliminationOkBtn.addEventListener('click', () => {
    proceedToEndTurn();
});

// (ح) شاشة نهاية اللعبة (Game Over)
playAgainBtn.addEventListener('click', () => {
    gameState.playerCount = 2;
    playerCountDisplay.textContent = '2';
    currentTimerStep = 0; // (تعديل!) إعادة لـ ∞
    timerSelectDisplay.textContent = '∞';
    gameState.timerDuration = 0;
    
    gameOverTitle.textContent = "انتهت الكروت!";
    gameOverMessage.textContent = "لقد أكملتم جميع الأسئلة. كانت جلسة رائعة!";
    showScreen('setup');
});

// (تعديل!) (ط) أزرار التحكم العلوية وشاشات الإيقاف
pauseBtn.addEventListener('click', pauseGame);
exitBtn.addEventListener('click', () => {
    // (إصلاح الخطأ #4)
    pauseGame(); // أوقف اللعبة
    showScreen('exitConfirm'); // اظهر شاشة تأكيد الخروج
});
resumeBtn.addEventListener('click', resumeGame);
exitConfirmYesBtn.addEventListener('click', exitGame);
exitConfirmNoBtn.addEventListener('click', () => {
    resumeGame(); // العودة للعبة
});


// --- 6. منطق اللعبة الأساسي ---

function proceedToEndTurn() {
    if (checkWinCondition()) return;
    
    // التحقق من عقوبة +2
    if (gameState.turnsToPlay > 1) {
        gameState.turnsToPlay--; 
        
        const currentPlayerName = gameState.playerNames[gameState.currentPlayerIndex];
        passDeviceTitle.textContent = `الدور على: ${currentPlayerName}`;
        passDeviceMessage.textContent = `دورك الإضافي (${gameState.turnsToPlay + 1}/2)! اضغط "أنا جاهز"`;
        showScreen('passDevice');
        return; 
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
    passDeviceMessage.textContent = 'مرر الجهاز للاعب التالي، ثم اضغط "أنا جاهز"!'; 
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
    gameState.turnsToPlay = 1; 
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

/** (إصلاح الخطأ #3) البحث عن كرت باللون المطلوب (للويلد كارد) */
function findAndDrawForcedCard(color) {
    for (let i = gameState.deck.length - 1; i >= 0; i--) {
        if (gameState.deck[i].color === color) {
            const card = gameState.deck.splice(i, 1)[0]; 
            return card;
        }
    }
    // إذا لم نجد الكرت، اسحب أي كرت وأجبره على استخدام بنك الأسئلة
    // (تعديل!) الأفضل سحب أي كرت، وتطبيق اللون المفروض على السؤال فقط
    // (سنعود للخطة الأصلية لأن البحث مكلف جداً - سنفرض السؤال فقط)
    // (الخطة ب:) سنفرض السؤال، لا الكرت.
    return gameState.deck.pop(); // اسحب كرت عشوائي
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
    // (إصلاح الخطأ #3 - الخطة ب)
    // لن نبحث عن كرت، سنسحب عشوائياً.
    // سيتم تطبيق اللون المفروض في 'createCardElement'
    card = gameState.deck.pop();
    
    gameState.currentCard = card; 
    gameState.totalTurns++;
    const cardElement = createCardElement(card);
    cardFront.innerHTML = ''; 
    cardFront.appendChild(cardElement);
}

/** (تعديل!) تطبيق تأثيرات الكروت (إصلاح +2 و القنبلة) */
function applyCardAction(card) {
    const playerCount = gameState.playerNames.length;
    let targetPlayerIndex = gameState.currentPlayerIndex; // الافتراضي هو اللاعب الحالي
    
    // البحث عن اللاعب النشط التالي (الضحية)
    let attempts = 0;
    do {
        targetPlayerIndex = (targetPlayerIndex + gameState.playDirection + playerCount) % playerCount;
        if (gameState.activePlayers[targetPlayerIndex].active && targetPlayerIndex !== gameState.currentPlayerIndex) {
            break; // وجدنا الضحية
        }
        attempts++;
    } while (attempts < playerCount * 2);

    // الآن نطبق الأكشن على 'targetPlayerIndex'
    
    if (card.value === 'reverse') {
        gameState.playDirection *= -1;
    
    } else if (card.value === 'skip') {
        // لا تفعل شيئاً، لأن 'proceedToEndTurn' سيتخطى اللاعب الحالي
        // (تعديل!) لا، يجب أن نجعل اللاعب التالي هو الضحية
        // (خطأ في المنطق السابق) - يجب أن نطبق التخطي على الضحية
        // (للبساطة، "تخطي" يعني أن اللاعب التالي سيفقد دوره)
        // (الكود الحالي لـ proceedToEndTurn ينقل الدور، لذا "تخطي" يعني نقل الدور مرتين)
        // (سنعتمد المنطق الأبسط: +1)
        gameState.currentPlayerIndex = (gameState.currentPlayerIndex + gameState.playDirection + playerCount) % playerCount;
    
    } else if (card.value === 'draw2') {
        // (إصلاح الخطأ #6) تطبيق العقوبة على اللاعب التالي
        gameState.activePlayers[targetPlayerIndex].turnsToPlay = 2;
    
    } else if (card.value === 'bomb') {
        // (إصلاح الخطأ #8)
        const targetPlayer = gameState.activePlayers[targetPlayerIndex];
        if (targetPlayer) {
            targetPlayer.active = false;
            eliminationMessage.textContent = `تم إقصاء اللاعب ${targetPlayer.name}!`;
        } else {
            eliminationMessage.textContent = "القنبلة لم تصب أحداً!";
        }
    }
}

/** (تعديل!) بناء عنصر HTML للكرت (إصلاح الوايلد) */
function createCardElement(card) {
    const cardDiv = document.createElement('div');
    // (إصلاح الوايلد #3) إذا تم فرض لون، أظهر الكرت باللون المفروض
    const displayColor = gameState.forcedColor || card.color;
    cardDiv.className = `neo-card card-${displayColor}`; 
    
    let question = '';
    let cornerIconSrc = '';
    
    if (card.type === 'number') {
        // (إصلاح الوايلد #3) استخدم اللون المفروض للسؤال
        const questionBank = gameState.questions[displayColor] || gameState.questions['green'];
        question = questionBank[Math.floor(Math.random() * questionBank.length)];
        cornerIconSrc = `assets/images/num-${card.value}.png`; 
    
    } else if (card.type === 'action') {
        // (إصلاح الوايلد #3)
        const questionBank = gameState.questions[displayColor] || gameState.questions['green'];
        question = questionBank[Math.floor(Math.random() * questionBank.length)];
        // (ملاحظة: السؤال سيكون من اللون المفروض، لكن الأيقونة من الكرت المسحوب)
        cornerIconSrc = `assets/images/icon-${card.value}.png`;
    
    } else if (card.type === 'wild') {
        question = ACTION_MESSAGES[card.value];
        cornerIconSrc = `assets/images/icon-${card.value}.png`;
    }

    // (إصلاح الوايلد #3) إعادة تعيين اللون المفروض بعد استخدامه
    if (gameState.forcedColor) {
        gameState.forcedColor = null;
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
        timerContainer.classList.remove('active');
        return;
    }
    
    timerContainer.classList.add('active'); 
    timerBar.style.transition = 'none'; 
    timerBar.style.width = '100%';
    timerBar.style.backgroundColor = 'var(--color-green)'; // (إعادة ضبط اللون)
    gameState.timeLeft = gameState.timerDuration;
    
    stopTimer(); 

    gameState.timerId = setInterval(() => {
        if (gameState.isPaused) return; 

        gameState.timeLeft -= 0.1;
        updateTimerBar();

        if (gameState.timeLeft <= 0) {
            console.log("انتهى الوقت!");
            stopTimer();
            if (gameState.currentCard.value !== 'bomb') { 
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
    if (!screens.exitConfirm.classList.contains('active')) {
        showScreen('pause');
    }
}

function resumeGame() {
    gameState.isPaused = false;
    screens.pause.classList.remove('active');
    screens.exitConfirm.classList.remove('active');
    showScreen('game');
}

function exitGame() {
    stopTimer();
    gameState.isPaused = false;
    screens.pause.classList.remove('active');
    screens.exitConfirm.classList.remove('active');
    
    gameState.playerCount = 2;
    playerCountDisplay.textContent = '2';
    currentTimerStep = 0; 
    timerSelectDisplay.textContent = '∞';
    gameState.timerDuration = 0;
    showScreen('setup');
}


// --- 8. تشغيل اللعبة ---
fetchQuestions().then(() => {
    timerSelectDisplay.textContent = timerSteps[currentTimerStep] === 0 ? '∞' : timerSteps[currentTimerStep];
    showScreen('setup'); 
});
