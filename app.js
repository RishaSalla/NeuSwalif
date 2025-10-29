// --- 2. تعريف متغيرات حالة اللعبة ---
let gameState = {
    playerCount: 2,
    playerNames: [],
    activePlayers: [], // (جديد) لتتبع اللاعبين الذين لم يتم إقصاؤهم
    currentPlayerIndex: 0,
    deck: [],
    playDirection: 1, 
    totalTurns: 0,
    questions: {},
    currentCard: null,
    forcedColor: null 
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

const wildColorPicker = document.getElementById('wild-color-picker');
const wildColorButtons = document.querySelectorAll('.wild-btn');

// (جديد) شاشة نهاية اللعبة (لتغيير النص)
const gameOverTitle = document.querySelector('#game-over-screen .modal-title');
const gameOverMessage = document.querySelector('#game-over-screen p');


const ACTION_MESSAGES = {
    'skip': "تخطي الدور! اللاعب التالي يفقد دوره.",
    'reverse': "عكس الاتجاه! اتجاه اللعب ينعكس الآن.",
    'draw2': "اسحب +2! اللاعب التالي يجاوب على سؤالين ويخسر دوره.",
    'wild': "وايلد كارد! اختر لون السؤال التالي.",
    'bomb': "قنبلة! 💣 اللاعب التالي يخرج من اللعبة!" // (تم تحديث الرسالة)
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
    flipCardBtn.classList.remove('hidden');
    endTurnBtn.classList.add('hidden');
    wildColorPicker.classList.add('hidden'); 
    showScreen('game');
});

// (د) زر "اقلب الكرت"
flipCardBtn.addEventListener('click', () => {
    if (cardFlipper) {
        cardFlipper.classList.add('flipped');
    }
    flipCardBtn.classList.add('hidden');
    
    // (تعديل!) التحقق إذا كان الكرت قنبلة أو وايلد
    if (gameState.currentCard.value === 'wild') {
        wildColorPicker.classList.remove('hidden');
    
    } else if (gameState.currentCard.value === 'bomb') {
        // إذا كان قنبلة، طبّق التأثير فوراً (الإقصاء)
        applyCardAction(gameState.currentCard);
        // ثم أظهر زر "السؤال التالي" (لإنهاء الدور)
        endTurnBtn.classList.remove('hidden');

    } else {
        endTurnBtn.classList.remove('hidden');
    }
});

// (هـ) أزرار اختيار لون الوايلد
wildColorButtons.forEach(button => {
    button.addEventListener('click', () => {
        gameState.forcedColor = button.dataset.color;
        wildColorPicker.classList.add('hidden');
        proceedToEndTurn(); // إنهاء الدور بعد اختيار اللون
    });
});


// (و) شاشة اللعب (Game Screen)
endTurnBtn.addEventListener('click', () => {
    // تطبيق الأكشن (للكروت العادية مثل Reverse/Skip)
    // (القنبلة تم تطبيقها عند قلب الكرت)
    if (gameState.currentCard.value !== 'bomb') {
         applyCardAction(gameState.currentCard);
    }
    proceedToEndTurn();
});

// (ز) شاشة نهاية اللعبة (Game Over)
playAgainBtn.addEventListener('click', () => {
    gameState.playerCount = 2;
    playerCountDisplay.textContent = '2';
    // (جديد) إعادة ضبط رسالة نهاية اللعبة
    gameOverTitle.textContent = "انتهت الكروت!";
    gameOverMessage.textContent = "لقد أكملتم جميع الأسئلة. كانت جلسة رائعة!";
    showScreen('setup');
});


// --- 6. منطق اللعبة الأساسي ---

/** (جديد) وظيفة إنهاء الدور (تبحث عن اللاعب النشط التالي) */
function proceedToEndTurn() {
    // 1. التحقق من حالة الفوز (قبل الانتقال للاعب التالي)
    if (checkWinCondition()) return;
    
    const playerCount = gameState.playerNames.length;
    let nextPlayerIndex = gameState.currentPlayerIndex;

    // 2. حلقة للبحث عن اللاعب النشط التالي
    do {
        nextPlayerIndex = (nextPlayerIndex + gameState.playDirection + playerCount) % playerCount;
    } while (!gameState.activePlayers[nextPlayerIndex]); // استمر في البحث إذا كان اللاعب التالي "غير نشط"

    gameState.currentPlayerIndex = nextPlayerIndex;
    
    // 3. التحقق من حالة الفوز (بعد الانتقال للاعب التالي)
    if (checkWinCondition()) return;

    passDeviceTitle.textContent = `الدور على: ${gameState.playerNames[gameState.currentPlayerIndex]}`;
    showScreen('passDevice');
}

/** (جديد) التحقق من الفوز */
function checkWinCondition() {
    // 1. تصفية اللاعبين النشطين
    const activePlayersList = gameState.activePlayers.filter(player => player.active);
    
    if (activePlayersList.length === 1) {
        // 2. إذا بقي لاعب واحد، أعلن الفوز
        const winner = activePlayersList[0];
        gameOverTitle.textContent = "لدينا فائز!";
        gameOverMessage.textContent = `تهانينا لـ ${winner.name}! لقد نجوت من كل القنابل!`;
        showScreen('gameOver');
        return true;
    
    } else if (activePlayersList.length === 0) {
        // (حالة نادرة جداً: تعادل أو قنبلة أخيرة)
        gameOverTitle.textContent = "تعادل!";
        gameOverMessage.textContent = "تم إقصاء جميع اللاعبين!";
        showScreen('gameOver');
        return true;
    }
    return false;
}

/** (تعديل!) إعادة تعيين وبدء اللعبة */
function resetGame() {
    gameState.currentPlayerIndex = 0;
    gameState.playDirection = 1;
    gameState.totalTurns = 0;
    gameState.deck = [];
    gameState.forcedColor = null;
    
    // (جديد) ملء مصفوفة اللاعبين النشطين
    gameState.activePlayers = gameState.playerNames.map((name, index) => ({
        index: index,
        name: name,
        active: true // كلهم نشطون في البداية
    }));
    
    buildDeck();
    shuffleDeck();

    passDeviceTitle.textContent = `الدور على: ${gameState.playerNames[0]}`;
    showScreen('passDevice');
}

async function fetchQuestions() {
    // ... (الكود كما هو - لا تغيير) ...
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
    // ... (تعديل بسيط: التحقق من الفوز قبل سحب الكرت) ...
    if (checkWinCondition()) return;

    if (gameState.deck.length === 0) {
        // (جديد) إذا انتهت الكروت ولم يفز أحد (نادر)
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

/** (تعديل!) تطبيق تأثيرات الكروت */
function applyCardAction(card) {
    const playerCount = gameState.playerNames.length;
    
    if (card.value === 'reverse') {
        gameState.playDirection *= -1;
    
    } else if (card.value === 'skip') {
        // (تعديل!) أصبحنا نبحث عن اللاعب النشط التالي، لذا "التخطي" يعني إضافة 1 للبحث
        gameState.currentPlayerIndex = (gameState.currentPlayerIndex + gameState.playDirection + playerCount) % playerCount;
    
    } else if (card.value === 'draw2') {
        // (نفس تأثير Skip حالياً)
        gameState.currentPlayerIndex = (gameState.currentPlayerIndex + gameState.playDirection + playerCount) % playerCount;
    
    } else if (card.value === 'bomb') {
        // (جديد!) منطق القنبلة
        // 1. إيجاد اللاعب الهدف (التالي)
        const targetIndex = (gameState.currentPlayerIndex + gameState.playDirection + playerCount) % playerCount;
        
        // 2. التحقق من أنه "نشط" (إذا لم يكن نشطاً، ابحث عن الذي يليه)
        // (للبساطة الآن، سنقصي الهدف المباشر حتى لو كان مقصياً، لكن الأفضل هو البحث)
        // (تعديل بسيط: نفترض أننا نبحث عن أول لاعب نشط تالٍ)
        let targetPlayer = null;
        let searchIndex = gameState.currentPlayerIndex;
        do {
            searchIndex = (searchIndex + gameState.playDirection + playerCount) % playerCount;
        } while (!gameState.activePlayers[searchIndex].active || searchIndex === gameState.currentPlayerIndex); // ابحث عن لاعب نشط غير اللاعب الحالي

        targetPlayer = gameState.activePlayers[searchIndex];

        // 3. إقصاء اللاعب
        if (targetPlayer) {
            targetPlayer.active = false;
            console.log(`تم إقصاء اللاعب: ${targetPlayer.name}`);
            
            // 4. عرض رسالة (مؤقتة)
            // (سنضيف شاشة "إقصاء" احترافية لاحقاً بدلاً من alert)
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


// --- 7. تشغيل اللعبة ---
fetchQuestions().then(() => {
    showScreen('setup'); 
});
