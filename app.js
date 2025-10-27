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
        currentCard: null // (جديد) لتخزين الكرت المسحوب حالياً
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
    const showCardBtn = document.getElementById('show-card-btn'); // (موجود من قبل)

    // (جديد) شاشة اللعب
    const cardContainer = document.getElementById('card-container');
    const deckCounter = document.getElementById('deck-counter');
    const endTurnBtn = document.getElementById('end-turn-btn');

    // (جديد) شاشة النهاية
    const playAgainBtn = document.getElementById('play-again-btn');

    // (جديد) رسائل كروت الأكشن
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
        
        // إعادة تعيين حالة اللعبة بالكامل
        resetGame();
    });

    // (جديد) (ج) شاشة تمرير الجهاز (Pass Device)
    showCardBtn.addEventListener('click', () => {
        // سحب كرت وعرضه
        drawAndDisplayCard();
        // الانتقال لشاشة اللعب
        showScreen('game');
    });

    // (سنبرمج أزرار "السؤال التالي" و "العب مجدداً" لاحقاً)


    // --- 6. منطق اللعبة الأساسي ---

    /** (جديد) إعادة تعيين وبدء اللعبة */
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

    /** جلب الأسئلة من ملف JSON */
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

    /** بناء كومة الكروت (108 كرت) */
    function buildDeck() {
        gameState.deck = [];
        const colors = ['red', 'blue', 'green', 'yellow'];
        const values = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
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

    /** خلط الكروت عشوائياً */
    function shuffleDeck() {
        for (let i = gameState.deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [gameState.deck[i], gameState.deck[j]] = [gameState.deck[j], gameState.deck[i]];
        }
    }

    /** (جديد) سحب كرت وعرضه */
    function drawAndDisplayCard() {
        // 1. التحقق إذا انتهت الكروت
        if (gameState.deck.length === 0) {
            showScreen('gameOver');
            return;
        }

        // 2. سحب كرت
        const card = gameState.deck.pop();
        gameState.currentCard = card; // تخزين الكرت الحالي
        gameState.totalTurns++;

        // 3. بناء عنصر HTML للكرت
        const cardElement = createCardElement(card);
        
        // 4. عرض الكرت في الحاوية
        cardContainer.innerHTML = ''; // مسح الكرت القديم
        cardContainer.appendChild(cardElement);

        // 5. تحديث عداد الكروت
        deckCounter.textContent = `الكرت ${gameState.totalTurns} / 108`;
    }

    /** (جديد) بناء عنصر HTML للكرت */
    function createCardElement(card) {
        const cardDiv = document.createElement('div');
        // (ملاحظة: سنصمم هذه الكلاسات في style.css لاحقاً)
        cardDiv.className = `neo-card card-${card.color} card-type-${card.type}`;
        
        let question = '';
        let cornerIconSrc = '';
        let logoSrc = 'assets/images/logo.png'; // (اسم افتراضي للشعار)

        if (card.type === 'number') {
            // كرت رقم (سوالف)
            const questionBank = gameState.questions[card.color] || gameState.questions['green']; // (الأخضر احتياطي)
            question = questionBank[Math.floor(Math.random() * questionBank.length)];
            // (سنحتاج صوراً للأرقام، لكن للتبسيط سنستخدم الأيقونات)
            // (حالياً نترك الأيقونة فارغة لكرت الرقم)
            cornerIconSrc = ''; // (مثل: `assets/images/num-${card.value}.png`)
        
        } else if (card.type === 'action') {
            // كرت أكشن
            question = ACTION_MESSAGES[card.value];
            cornerIconSrc = `assets/images/icon-${card.value}.png`; // (مثل: icon-skip.png)
        
        } else if (card.type === 'wild') {
            // كرت وايلد أو قنبلة
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
