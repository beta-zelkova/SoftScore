// データの状態（State）
let strikes = 0;
let balls = 0;
let outs = 0;
let inning = 0;
let side = 1;

// ボタン要素の取得
const btnLooking = document.getElementById('btn-looking');
const btnSwing = document.getElementById('btn-swing');
const btnFoul = document.getElementById('btn-foul');
const btnBall = document.getElementById('btn-ball');
const btnOut = document.getElementById('btn-out');
const btnundo = document.getElementById('btn-undo');

// ストライクボタンが押された時
btnLooking.addEventListener('click', () => {
    strikes++;
    if (strikes >= 3) {
        strikes = 0;
        balls = 0;
        addOut(); // 3ストライクでアウト
    }
    updateDisplay();
});

btnSwing.addEventListener('click', () => {
    strikes++
    if (strikes >= 3) {
        strikes = 0;
        balls = 0;
        addOut(); // 3ストライクでアウト
    }
    updateDisplay();
})

btnFoul.addEventListener('click', () => {
    strikes++
    if (strikes >= 2) {
        strikes = 2;
    }
    updateDisplay();
})

btnBall.addEventListener('click', () => {
    balls++
    if (balls >= 4) {
        strikes = 0;
        balls = 0;
    }
    updateDisplay();
})

// アウトを増やす共通処理
function addOut() {
    outs++;
    if (outs >= 3) {
        strikes = 0;
        balls = 0;
        outs = 0;
    }
}


// 開始時刻表示する
let str_time;//開始時刻を保管
let timerInterval;

const btnStart = document.getElementById('btn-start');
const btnReset = document.getElementById('btn-reset');

btnStart.addEventListener('click', () => {
    str_time = new Date();

    const hours = str_time.getHours().toString().padStart(2, '0');
    const minutes = str_time.getMinutes().toString().padStart(2, '0');
    displayStartTime.textContent = `${hours}:${minutes}`;

    updateTimer();
    timerInterval = setInterval(updateTimer, 60000);

    btnStart.disabled = true;
    btnStart.textContent = "試合中";
})

function updateTimer() {
    const now = new Date();
    const diff = now - str_time; // ミリ秒単位の差分

    const totalSeconds = Math.floor(diff / 1000);
    const minutes = Math.floor(totalSeconds / 60);

    const displayM = minutes.toString().padStart(2, '0');
    displayElapsedTime.textContent = `${displayM}分`;
}

btnReset.addEventListener('click', () => {
    displayStartTime.textContent = `-:-`;
    displayElapsedTime.textContent = `00:00`;

    btnStart.disabled = false;
    btnStart.textContent = "試合開始";
    clearInterval(timerInterval);
})

// 画面を更新する関数（DOM操作）
function updateDisplay() {
    renderDots('strike-dots', strikes, 'strike-on');
    renderDots('ball-dots', balls, 'ball-on');
    renderDots('out-dots', outs, 'out-on');
}

// 丸印を描画する補助関数
function renderDots(containerId, count, activeClass) {
    const container = document.getElementById(containerId);
    container.innerHTML = ''; // 一旦クリア
    for (let i = 0; i < count; i++) {
        const span = document.createElement('span');
        span.classList.add('dot', activeClass);
        container.appendChild(span);
    }
}

// 初期表示
updateDisplay();