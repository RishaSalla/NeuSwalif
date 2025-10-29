// --- 1. انتظار تحميل الصفحة (تم الحذف - نعتمد على 'defer') ---

// --- 2. تعريف متغيرات حالة اللعبة ---
let gameState = {
    playerCount: 2,
    playerNames: [],
    currentPlayerIndex: 0,
    deck: [],
    playDirection: 1, 
    totalTurns: 0,
    questions: {},
    currentCard: null 
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

// (جديد) عناصر أنيميشن القلب
const flipCardBtn = document.getElementById('flip-card-btn');
const cardFlipper = document.getElementById('card-flipper');
const cardFront = document.querySelector('.card-front'); // الواجهة الأمامية للكرت

const ACTION_MESSAGES = {
    'skip': "تخطي الدور! اللاعب التالي يفقد دوره.",
    'reverse': "عكس الاتجاه! اتجاه اللعب ينعكس الآن.",
    'draw2': "اسحب +2! اللاعب التالي يجاوب على سؤالين ويخسر دوره.",
    'wild': "وايلد كارد! اختر أي نوع سؤال (لون) للاعب التالي.",
    'bomb': "قنبلة +4! أنت الزعيم! اختر لاعباً ليجاوب على 4 أسئلة!"
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
// (تعديل!) هذا الزر الآن يجهز الكرت ويظهر "ظهر الكرت"
showCardBtn.addEventListener('click', () => {
    // 1. سحب الكرت وتجهيزه في الواجهة الأمامية (وهي مخفية)
    drawAndDisplayCard();
    
    // 2. التأكد من أن الكرت "غير مقلوب" (يظهر الظهر)
    if (cardFlipper) {
        cardFlipper.classList.remove('flipped');
    }
    
    // 3. إظهار زر "اقلب الكرت" وإخفاء زر "السؤال التالي"
    flipCardBtn.classList.remove('hidden');
    endTurnBtn.classList.add('hidden');
    
    // 4. الانتقال لشاشة اللعب
    showScreen('game');
});

// (جديد!) (د) زر "اقلب الكرت"
flipCardBtn.addEventListener('click', () => {
    // 1. قلب الكرت (الأنيميشن)
    if (cardFlipper) {
        cardFlipper.classList.add('flipped');
    }
    
    // 2. إخفاء زر "اقلب الكرت"
    flipCardBtn.classList.add('hidden');
    
    // 3. إظهار زر "السؤال التالي"
    endTurnBtn.classList.remove('hidden');
});


// (هـ) شاشة اللعب (Game Screen)
endTurnBtn.addEventListener('click', () => {
    applyCardAction(gameState.currentCard);

    const playerCount = gameState.playerNames.length;
    gameState.currentPlayerIndex = (gameState.currentPlayerIndex + gameState.playDirection + playerCount) % playerCount;

    passDeviceTitle.textContent = `الدور على: ${gameState.playerNames[gameState.currentPlayerIndex]}`;
    showScreen('passDevice');
});

// (و) شاشة نهاية اللعبة (Game Over)
playAgainBtn.addEventListener('click', () => {
    gameState.playerCount = 2;
    playerCountDisplay.textContent = '2';
    showScreen('setup');
});


// --- 6. منطق اللعبة الأساسي ---

function resetGame() {
    gameState.currentPlayerIndex = 0;
    gameState.playDirection = 1;
    gameState.totalTurns = 0;
    gameState.deck = [];
    
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
    for (let i = gameState.deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [gameState.deck[i], gameState.deck[j]] = [gameState.deck[j], gameState.deck[i]];
    }
}

// (تعديل!) هذه الوظيفة الآن تضع الكرت في "الواجهة الأمامية"
function drawAndDisplayCard() {
    if (gameState.deck.length === 0) {
        showScreen('gameOver');
        return;
    }

    const card = gameState.deck.pop();
    gameState.currentCard = card; 
    gameState.totalTurns++;

    const cardElement = createCardElement(card);
    
    // مسح الكرت القديم ووضع الجديد في الواجهة الأمامية
    cardFront.innerHTML = ''; 
    cardFront.appendChild(cardElement);

    deckCounter.textContent = `الكرت ${gameState.totalTurns} / 108`;
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
}

function createCardElement(card) {
    const cardDiv = document.createElement('div');
    // (ملاحظة: هذا هو الآن card-front)
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


// --- 7. تشغيل اللعبة ---
fetchQuestions().then(() => {
    showScreen('setup'); 
});
