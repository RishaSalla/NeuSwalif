// --- 1. الانتظار حتى يتم تحميل الصفحة ---
document.addEventListener('DOMContentLoaded', () => {

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
    const endTurnBtn = document.getElementById('end-turn-btn'); // (موجود من قبل)

    const playAgainBtn = document.getElementById('play-again-btn'); // (موجود من قبل)

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
            screens[id].classList.remove('active');
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
        showScreen('game');
    });

    // (جديد) (د) شاشة اللعب (Game Screen)
    endTurnBtn.addEventListener('click', () => {
        // 1. تطبيق تأثير الكرت (مثل تخطي اللاعب التالي)
        applyCardAction(gameState.currentCard);

        // 2. حساب اللاعب التالي
        const playerCount = gameState.playerNames.length;
        // (نضيف playerCount لضمان أن الناتج موجب دائماً قبل باقي القسمة)
        gameState.currentPlayerIndex = (gameState.currentPlayerIndex + gameState.playDirection + playerCount) % playerCount;

        // 3. تحديث شاشة تمرير الجهاز للاعب التالي
        passDeviceTitle.textContent = `الدور على: ${gameState.playerNames[gameState.currentPlayerIndex]}`;
        showScreen('passDevice');
    });

    // (جديد) (هـ) شاشة نهاية اللعبة (Game Over)
    playAgainBtn.addEventListener('click', () => {
        // إعادة تعيين كل شيء والعودة لشاشة الإعداد
        gameState.playerCount = 2; // إعادة تعيين لافتراضي
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
            const response = await fetch('assets/data/questions.json');
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

    function drawAndDisplayCard() {
        if (gameState.deck.length === 0) {
            showScreen('gameOver');
            return;
        }

        const card = gameState.deck.pop();
        gameState.currentCard = card; 
        gameState.totalTurns++;

        const cardElement = createCardElement(card);
        
        cardContainer.innerHTML = ''; 
        cardContainer.appendChild(cardElement);

        deckCounter.textContent = `الكرت ${gameState.totalTurns} / 108`;
    }

    /** (جديد) تطبيق تأثيرات الكروت */
    function applyCardAction(card) {
        const playerCount = gameState.playerNames.length;

        if (card.value === 'reverse') {
            gameState.playDirection *= -1; // عكس الاتجاه
        
        } else if (card.value === 'skip') {
            // تخطي اللاعب التالي (نضيف 1 للدور)
            gameState.currentPlayerIndex = (gameState.currentPlayerIndex + gameState.playDirection + playerCount) % playerCount;
        
        } else if (card.value === 'draw2') {
            // تخطي اللاعب التالي (نفس تأثير Skip في لعبتنا)
            // (يمكن تعديلها لاحقاً لجعله يسحب 2)
            gameState.currentPlayerIndex = (gameState.currentPlayerIndex + gameState.playDirection + playerCount) % playerCount;
        
        } else if (card.value === 'bomb') {
            // كرت القنبلة (+4)
            // (حالياً لا نفعل شيئاً سوى إظهار الرسالة، يمكن تعديلها لاحقاً)
            // (لأن اللاعب الحالي هو من يختار، لا نحتاج لتخطي أدوار)
        }
    }

    function createCardElement(card) {
        const cardDiv = document.createElement('div');
        cardDiv.className = `neo-card card-${card.color} card-type-${card.type}`;
        
        let question = '';
        let cornerIconSrc = '';
        let logoSrc = 'assets/images/logo.png'; // (اسم افتراضي للشعار)

        if (card.type === 'number') {
            const questionBank = gameState.questions[card.color] || gameState.questions['green'];
            question = questionBank[Math.floor(Math.random() * questionBank.length)];
            
            // (للبساطة، لن نعرض أيقونات للأرقام، سنعتمد على الخلفية فقط)
            cornerIconSrc = ''; 
        
        } else if (card.type === 'action') {
            question = ACTION_MESSAGES[card.value];
            cornerIconSrc = `assets/images/icon-${card.value}.png`; // (مثل: icon-skip.png)
        
        } else if (card.type === 'wild') {
            question = ACTION_MESSAGES[card.value];
            cornerIconSrc = `assets/images/icon-${card.value}.png`; // (مثل: icon-bomb.png)
        }

        // بناء الـ HTML الداخلي للكرت
        cardDiv.innerHTML = `
            <div class="card-corner top-left">
                ${cornerIconSrc ? `<img src="${cornerIconSrc}" alt="${card.value}">` : ''}
            </div>
            <div class="card-content-box pixel-speech-box">
                <p class="card-question">${question}</p>
            </div>
            <div class="card-logo">
                <img src="${logoSrc}" alt="NEO Sawlif">
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

});
