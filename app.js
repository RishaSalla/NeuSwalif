// --- 1. الانتظار حتى يتم تحميل الصفحة ---
document.addEventListener('DOMContentLoaded', () => {

    // --- 2. تعريف متغيرات حالة اللعبة ---
    let gameState = {
        playerCount: 2,
        playerNames: [],
        currentPlayerIndex: 0,
        deck: [],
        playDirection: 1, // 1 = للأمام, -1 = للخلف
        totalTurns: 0,
        questions: {} // سيتم ملؤه من ملف JSON
    };

    // --- 3. ربط عناصر الواجهة (DOM Elements) ---
    
    // الشاشات (Modals)
    const screens = {
        setup: document.getElementById('setup-screen'),
        names: document.getElementById('names-screen'),
        passDevice: document.getElementById('pass-device-screen'),
        game: document.getElementById('game-screen'),
        gameOver: document.getElementById('game-over-screen')
    };

    // شاشة الإعداد (Setup)
    const playerCountDisplay = document.getElementById('player-count-display');
    const incrementPlayersBtn = document.getElementById('increment-players');
    const decrementPlayersBtn = document.getElementById('decrement-players');
    const setupNextBtn = document.getElementById('setup-next-btn');

    // شاشة الأسماء (Names)
    const playerNamesInputsContainer = document.getElementById('player-names-inputs');
    const startGameBtn = document.getElementById('start-game-btn');
    
    // شاشة تمرير الجهاز (Pass Device)
    const passDeviceTitle = document.getElementById('pass-device-title');
    const showCardBtn = document.getElementById('show-card-btn');

    // (سنضيف باقي الأزرار لاحقاً)


    // --- 4. وظيفة التنقل بين الشاشات ---
    function showScreen(screenId) {
        for (let id in screens) {
            screens[id].classList.remove('active');
        }
        if (screens[screenId]) {
            screens[screenId].classList.add('active');
        }
    }


    // --- 5. ربط الأحداث (Event Listeners) ---

    // --- (أ) شاشة الإعداد ---
    
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

    // --- (ب) شاشة الأسماء ---
    
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
        // 1. جمع الأسماء من الصناديق
        const nameInputs = document.querySelectorAll('.player-name-input');
        gameState.playerNames = Array.from(nameInputs).map((input, i) => input.value || `لاعب ${i + 1}`);
        
        // 2. إعادة تعيين حالة اللعبة والبدء
        gameState.currentPlayerIndex = 0;
        gameState.playDirection = 1;
        gameState.totalTurns = 0;
        
        // 3. بناء وخلط الكروت
        buildDeck();
        shuffleDeck();

        // 4. إظهار شاشة تمرير الجهاز لأول لاعب
        passDeviceTitle.textContent = `الدور على: ${gameState.playerNames[0]}`;
        showScreen('passDevice');
    });
    
    
    // --- 6. منطق اللعبة الأساسي ---

    /** (جديد) جلب الأسئلة من ملف JSON */
    async function fetchQuestions() {
        try {
            const response = await fetch('assets/data/questions.json');
            if (!response.ok) {
                throw new Error('فشل تحميل ملف الأسئلة!');
            }
            gameState.questions = await response.json();
            console.log("تم تحميل الأسئلة بنجاح:", gameState.questions);
        } catch (error) {
            console.error(error);
            // عرض رسالة خطأ للمستخدم إذا فشل تحميل الأسئلة
            alert('خطأ فادح: لم يتم تحميل بنك الأسئلة. الرجاء تحديث الصفحة.');
        }
    }

    /** (جديد) بناء كومة الكروت (108 كرت) */
    function buildDeck() {
        gameState.deck = [];
        const colors = ['red', 'blue', 'green', 'yellow'];
        const values = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
        const actions = ['skip', 'reverse', 'draw2']; // تخطي، عكس، اسحب 2
        const wilds = ['wild', 'bomb']; // Wild, و Bomb (+4)

        for (const color of colors) {
            // كرت '0' واحد من كل لون
            gameState.deck.push({ type: 'number', color: color, value: '0' });

            // كرتين من كل رقم (1-9)
            for (let i = 1; i <= 9; i++) {
                gameState.deck.push({ type: 'number', color: color, value: i.toString() });
                gameState.deck.push({ type: 'number', color: color, value: i.toString() });
            }
            
            // كرتين من كل أكشن
            for (const action of actions) {
                gameState.deck.push({ type: 'action', color: color, value: action });
                gameState.deck.push({ type: 'action', color: color, value: action });
            }
        }
        
        // 4 كروت وايلد و 4 كروت قنبلة (+4)
        for (let i = 0; i < 4; i++) {
            gameState.deck.push({ type: 'wild', color: 'black', value: 'wild' }); // الوايلد العادي
            gameState.deck.push({ type: 'wild', color: 'black', value: 'bomb' }); // كرت القنبلة
        }
        
        console.log(`تم بناء الكومة: ${gameState.deck.length} كرت`);
    }

    /** (جديد) خلط الكروت عشوائياً */
    function shuffleDeck() {
        // خوارزمية فيشر-ييتس للخلط
        for (let i = gameState.deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [gameState.deck[i], gameState.deck[j]] = [gameState.deck[j], gameState.deck[i]];
        }
        console.log("تم خلط الكروت.");
    }

    
    // --- 7. تشغيل اللعبة ---
    
    // 1. جلب الأسئلة أولاً
    fetchQuestions().then(() => {
        // 2. إظهار شاشة الإعداد بعد التأكد من تحميل الأسئلة
        showScreen('setup'); 
    });

});
