// --- 2. تعريف متغيرات حالة اللعبة ---
let gameState = {
    playerCount: 2,
    playerNames: [],
    currentPlayerIndex: 0,
    deck: [],
    playDirection: 1, 
    totalTurns: 0,
    questions: {},
    currentCard: null,
    forcedColor: null // (جديد) لتخزين لون الوايلد كارد
};

// --- 3. ربط عناصر الواجهة (DOM Elements) ---
const screens = {
    setup: document.getElementById('setup-screen'),
    names: document.getElementById('names-screen'),
    passDevice: document.getElementById('pass-device-screen'),
    game: document.getElementById('game-screen'),
    gameOver: document.getElementById('game-over-screen')
};

const playerCountDisplay = document.getElementById('player-count-display');
const incrementPlayersBtn = document.getElementById('increment-players');
const decrementPlayersBtn = document.getElementById('decrement-players');
const setupNextBtn = document.getElementById('setup-next-btn');

const playerNamesInputsContainer = document.getElementById('player-names-inputs');
const startGameBtn = document.getElementById('start-game-btn');

const passDeviceTitle = document.getElementById('pass-device-title');
const showCardBtn = document.getElementById('show-card-btn');

const cardContainer = document.getElementById('card-container');
const deckCounter = document.getElementById('deck-counter');
const endTurnBtn = document.getElementById('end-turn-btn');
const playAgainBtn = document.getElementById('play-again-btn');

const flipCardBtn = document.getElementById('flip-card-btn');
const cardFlipper = document.getElementById('card-flipper');
const cardFront = document.querySelector('.card-front');

// (جديد) عناصر الوايلد كارد
const wildColorPicker = document.getElementById('wild-color-picker');
const wildColorButtons = document.querySelectorAll('.wild-btn');

const ACTION_MESSAGES = {
    'skip': "تخطي الدور! اللاعب التالي يفقد دوره.",
    'reverse': "عكس الاتجاه! اتجاه اللعب ينعكس الآن.",
    'draw2': "اسحب +2! اللاعب التالي يجاوب على سؤالين ويخسر دوره.",
    'wild': "وايلد كارد! اختر لون السؤال التالي.", // (تم تعديل الرسالة)
    'bomb': "قنبلة! اللاعب التالي يخرج من اللعبة!" // (تم تعديل الرسالة بناءً على مناقشتنا)
};

// --- 4. وظيفة التنقل بين الشاشات ---
function showScreen(screenId) {
    for (let id in screens) {
        if (screens[id]) {
            screens[id].classList.remove('active');
        }
    }
    if (screens[screenId]) {
        screens[id].classList.add('active');
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
setupNextBtn.addEventListener('click', () => {
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
    drawAndDisplayCard();
    
    if (cardFlipper) {
        cardFlipper.classList.remove('flipped');
    }
    
    // إظهار زر "اقلب الكرت" وإخفاء الأزرار الأخرى
    flipCardBtn.classList.remove('hidden');
    endTurnBtn.classList.add('hidden');
    wildColorPicker.classList.add('hidden'); // (جديد) إخفاء أزرار الوايلد
    
    showScreen('game');
});

// (د) زر "اقلب الكرت" (تعديل!)
flipCardBtn.addEventListener('click', () => {
    if (cardFlipper) {
        cardFlipper.classList.add('flipped');
    }
    flipCardBtn.classList.add('hidden');
    
    // (جديد) التحقق إذا كان الكرت وايلد
    if (gameState.currentCard.value === 'wild') {
        // نعم وايلد: أظهر أزرار الألوان
        wildColorPicker.classList.remove('hidden');
    } else {
        // لا: أظهر زر "السؤال التالي" كالمعتاد
        endTurnBtn.classList.remove('hidden');
    }
});

// (جديد!) (هـ) أزرار اختيار لون الوايلد
wildColorButtons.forEach(button => {
    button.addEventListener('click', () => {
        // 1. خزن اللون المختار
        gameState.forcedColor = button.dataset.color;
        console.log(`تم اختيار اللون: ${gameState.forcedColor}`);
        
        // 2. إخفاء الأزرار
        wildColorPicker.classList.add('hidden');
        
        // 3. إنهاء الدور
        proceedToEndTurn();
    });
});


// (و) شاشة اللعب (Game Screen)
endTurnBtn.addEventListener('click', () => {
    // (ملاحظة: كرت القنبلة سيتم التعامل معه هنا لاحقاً)
    applyCardAction(gameState.currentCard);
    proceedToEndTurn();
});

// (ز) شاشة نهاية اللعبة (Game Over)
playAgainBtn.addEventListener('click', () => {
    gameState.playerCount = 2;
    playerCountDisplay.textContent = '2';
    showScreen('setup');
});


// --- 6. منطق اللعبة الأساسي ---

/** (جديد) وظيفة إنهاء الدور (لتجنب التكرار) */
function proceedToEndTurn() {
    const playerCount = gameState.playerNames.length;
    gameState.currentPlayerIndex = (gameState.currentPlayerIndex + gameState.playDirection + playerCount) % playerCount;

    passDeviceTitle.textContent = `الدور على: ${gameState.playerNames[gameState.currentPlayerIndex]}`;
    showScreen('passDevice');
}

function resetGame() {
    gameState.currentPlayerIndex = 0;
    gameState.playDirection = 1;
    gameState.totalTurns = 0;
    gameState.deck = [];
    gameState.forcedColor = null; // (جديد)
    
    buildDeck();
    shuffleDeck();

    passDeviceTitle.textContent = `الدور على: ${gameState.playerNames[0]}`;
    showScreen('passDevice');
}

async function fetchQuestions() {
    try {
        const response = await fetch(`assets/data/questions.json?v=${new Date().getTime()}`);
        if (!response.ok) {
            throw new Error('فشل تحميل ملف الأسئلة!');
        }
        gameState.questions = await response.json();
        console.log("تم تحميل الأسئلة بنجاح.");
    } catch (error) {
        console.error(error);
        alert('خطأ فادح: لم يتم تحميل بنك الأسئلة. الرجاء تحديث الصفحة.');
    }
}

function buildDeck() {
    // ... (الكود كما هو - لا تغيير) ...
    gameState.deck = [];
    const colors = ['red', 'blue', 'green', 'yellow'];
    const actions = ['skip', 'reverse', 'draw2'];
    const wilds = ['wild', 'bomb'];
    for (const color of colors) {
        gameState.deck.push({ type: 'number', color: color, value: '0' });
        for (let i = 1; i <= 9; i++) {
            gameState.deck.push({ type: 'number', color: color, value: i.toString() });
            gameState.deck.push({ type: 'number', color: color, value: i.toString() });
        }
        for (const action of actions) {
            gameState.deck.push({ type: 'action', color: color, value: action });
            gameState.deck.push({ type: 'action', color: color, value: action });
        }
    }
    for (let i = 0; i < 4; i++) {
        gameState.deck.push({ type: 'wild', color: 'black', value: 'wild' });
        gameState.deck.push({ type: 'wild', color: 'black', value: 'bomb' });
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
    if (gameState.deck.length === 0) {
        showScreen('gameOver');
        return;
    }
    const card = gameState.deck.pop();
    gameState.currentCard = card; 
    gameState.totalTurns++;
    const cardElement = createCardElement(card);
    cardFront.innerHTML = ''; 
    cardFront.appendChild(cardElement);
    // (لا حاجة لتحديث العداد لأنه مخفي)
}

function applyCardAction(card) {
    const playerCount = gameState.playerNames.length;
    if (card.value === 'reverse') {
        gameState.playDirection *= -1;
    } else if (card.value === 'skip') {
        gameState.currentPlayerIndex = (gameState.currentPlayerIndex + gameState.playDirection + playerCount) % playerCount;
    } else if (card.value === 'draw2') {
        gameState.currentPlayerIndex = (gameState.currentPlayerIndex + gameState.playDirection + playerCount) % playerCount;
    }
    // (كرت القنبلة سيتم تعديله في الخطوة التالية)
}

/** (تعديل!) بناء عنصر HTML للكرت */
function createCardElement(card) {
    const cardDiv = document.createElement('div');
    cardDiv.className = `neo-card card-${card.color}`; 
    
    let question = '';
    let cornerIconSrc = '';
    
    if (card.type === 'number') {
        // (جديد!) التحقق من اللون المفروض
        const colorToUse = gameState.forcedColor || card.color;
        const questionBank = gameState.questions[colorToUse] || gameState.questions['green'];
        
        question = questionBank[Math.floor(Math.random() * questionBank.length)];
        cornerIconSrc = `assets/images/num-${card.value}.png`; 
        
        // (جديد!) إعادة تعيين اللون المفروض بعد استخدامه
        if (gameState.forcedColor) {
            gameState.forcedColor = null;
        }
    
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


// --- 7. تشغيل اللعبة ---
fetchQuestions().then(() => {
    showScreen('setup'); 
});
