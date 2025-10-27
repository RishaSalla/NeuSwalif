// --- 1. الانتظار حتى يتم تحميل الصفحة ---
// (نضع كل الكود داخل هذا الحدث لضمان أن HTML جاهز)
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
    
    // (سنضيف باقي الأزرار لاحقاً)


    // --- 4. وظيفة التنقل بين الشاشات ---
    /**
     * @param {string} screenId (id الشاشة التي نريد إظهارها)
     */
    function showScreen(screenId) {
        // إخفاء جميع الشاشات
        for (let id in screens) {
            screens[id].classList.remove('active');
        }
        
        // إظهار الشاشة المطلوبة
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
        // إنشاء صناديق إدخال الأسماء بناءً على العدد
        createNameInputs(gameState.playerCount);
        // الانتقال لشاشة الأسماء
        showScreen('names');
    });

    // --- (ب) شاشة الأسماء ---
    
    /**
     * @param {number} count (عدد اللاعبين)
     */
    function createNameInputs(count) {
        // مسح الصناديق القديمة أولاً
        playerNamesInputsContainer.innerHTML = ''; 
        
        for (let i = 0; i < count; i++) {
            const input = document.createElement('input');
            input.type = 'text';
            input.placeholder = `اسم اللاعب ${i + 1}`;
            input.className = 'player-name-input'; // (يمكننا تصميم هذا الكلاس لاحقاً)
            playerNamesInputsContainer.appendChild(input);
        }
    }

    // (زر "إبدأ اللعبة" سنبرمجه في الخطوة التالية بعد جلب الأسئلة)
    
    
    // --- 6. تشغيل اللعبة (مبدئياً) ---
    // (لا شيء هنا الآن، فقط التأكد أن شاشة الإعداد ظاهرة)
    showScreen('setup'); 

});
