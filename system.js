// 関数の定義
let balls = 0;
let strikes = 0;
let outs = 0;
let currentInning = 1;
let isTop = true;      // true＝表,false=裏
let topScores = [0,0 ,0 ,0 ,0 ,0 ,0];    // 先攻のスコア
let bottomScores = [0, 0, 0, 0, 0, 0,0]; // 後攻のスコア
let runners = [0, 0, 0];// ランナー (0:なし, 1:あり) [一塁, 二塁, 三塁]

// ===================================
// タイマーの部分
// ===================================

// タイマー用
let startTime;
let timePassed;
// --- タイマー・全体操作 ---
const timeStart = document.getElementById('time-start');
const timeReset = document.getElementById('time-reset');
const displayStartTime = document.getElementById('displayStartTime');
const displayElapsedTime = document.getElementById('displayElapsedTime');

timeStart.addEventListener('click', () => {
    startTime = new Date();
    // 開始時刻の表示
    const hours = startTime.getHours().toString().padStart(2, '0');
    const minutes = startTime.getMinutes().toString().padStart(2, '0');
    //　試合の経過時間を分で表記
    displayStartTime.textContent = `${hours}:${minutes}`;
    // 即時更新してからタイマー開始
    updateTimer();
    timePassed = setInterval(updateTimer, 60000); // 1分ごとに更新
    timeStart.disabled = true;
    timeStart.textContent = "試合中";
});

function updateTimer() {
    if (!startTime) return;
    const now = new Date();
    const diff = now - startTime;
    const minutes = Math.floor(diff / (1000 * 60)); // 分のみ計算
    displayElapsedTime.textContent = `${minutes}分`;
}

timeReset.addEventListener('click', () => {
    // タイマー停止
    clearInterval(timePassed);
    startTime = null;
    displayStartTime.textContent = "-:-";
    displayElapsedTime.textContent = "開始前";
    timeStart.disabled = false;
    timeStart.textContent = "試合開始";
    // スコアとカウントもリセットしてもよし
    // 合計の値がおかしかったので一回リセットは無し
    // resetGameData();
});

// ゲーム(登録中の試合のみ)のデータのリセット
function resetGameData() {
    strikes = 0; balls = 0; outs = 0;
    currentInning = 1; isTop = true;
    topScores = [0, 0, 0, 0, 0, 0, 0];
    bottomScores = [0, 0, 0, 0, 0, 0, 0];
    runners = [0, 0, 0];
    updateDisplay();
    updateScoreboard();
    updateRunnerDisplay();
}


// ===================================
// 結果入力の部分
// ===================================

// --- 画面遷移用ボタン ---
const btnReturn = document.getElementById('input-return');
const btnMenuBSO = document.getElementById('BSO');
const btnMenuOUT = document.getElementById('OUT');
const btnMenuHIT = document.getElementById('HIT');

// --- 各画面（エリア） ---
const areaPitchResult = document.getElementById('pitch-result'); // メインメニュー
const areaBSO = document.getElementById('BSO-detail');           // BSO詳細
const areaOut = document.getElementById('out-detail');           // アウト詳細
const areaHit = document.getElementById('hit-detail');           // 安打詳細

// --- 入力ボタン（BSO） ---
const btnLooking = document.getElementById('btn-looking');
const btnSwing = document.getElementById('btn-swing');
const btnFoul = document.getElementById('btn-foul');
const btnBall = document.getElementById('btn-ball');

// --- 入力ボタン（OUT/HIT） ---
const btnFly = document.getElementById('fly-out');
const btnGround = document.getElementById('ground-out');
const btnHitSingle = document.getElementById('hit-single');
const btnHitDouble = document.getElementById('hit-double');
const btnHitTriple = document.getElementById('hit-triple');
const btnHitHomerun = document.getElementById('hit-homerun');


/* =========================================
   3. 初期化処理
   ========================================= */
// 最初に一度画面を描画する
updateDisplay();
updateScoreboard();
updateRunnerDisplay();



/* =========================================
   5. 画面遷移ロジック（SPA）
   ========================================= */
// 共通：すべての詳細画面を隠す関数
function hideAllDetails() {
    areaBSO.classList.add('hidden');
    areaOut.classList.add('hidden');
    areaHit.classList.add('hidden');
    areaPitchResult.classList.add('hidden');
}

// メニューボタンの操作
btnMenuBSO.addEventListener('click', () => {
    hideAllDetails();
    areaBSO.classList.remove('hidden');
});

btnMenuOUT.addEventListener('click', () => {
    hideAllDetails();
    areaOut.classList.remove('hidden');
});

btnMenuHIT.addEventListener('click', () => {
    hideAllDetails();
    areaHit.classList.remove('hidden');
});

// 戻るボタンの操作
btnReturn.addEventListener('click', () => {
    hideAllDetails();
    areaPitchResult.classList.remove('hidden'); // メインメニューを表示
});


/* =========================================
   6. カウント操作ロジック
   ========================================= */
// ストライク処理（見逃し・空振り共通）
function addStrike() {
    strikes++;
    if (strikes >= 3) {
        alert("三振！");
        resetCount();
        addOut();
        // 自動でアウト詳細へ遷移させたい場合はここを変える
        // hideAllDetails(); areaOut.classList.remove('hidden');
    }
    updateDisplay();
}

btnLooking.addEventListener('click', addStrike);
btnSwing.addEventListener('click', addStrike);

// ファール処理
btnFoul.addEventListener('click', () => {
    if (strikes < 2) {
        strikes++;
    }
    updateDisplay();
});

// ボール処理
btnBall.addEventListener('click', () => {
    balls++;
    if (balls >= 4) {
        alert("フォアボール");
        resetCount();
        // フォアボールなら自動で一塁へ
        runners[0] = 1;
        updateRunnerDisplay();
    }
    updateDisplay();
});

// カウントリセット（打席完了時など）
function resetCount() {
    strikes = 0;
    balls = 0;
}


/* =========================================
   7. アウト・得点・イニング処理
   ========================================= */
// アウトボタン（フライ・ゴロ）
function handleOut() {
    addOut();
    resetCount();
    updateDisplay();
    // メインメニューに戻る
    btnReturn.click();
}
btnFly.addEventListener('click', handleOut);
btnGround.addEventListener('click', handleOut);

// アウト追加とチェンジ判定
function addOut() {
    outs++;
    if (outs >= 3) {
        alert("チェンジ！");
        outs = 0;
        runners = [0, 0, 0]; // ランナー一掃
        changeInning();
    }
}

// イニング切り替え
function changeInning() {
    if (!isTop) {
        // 裏が終わったら次の回へ
        currentInning++;
        if (currentInning > 7) {
            alert("試合終了（7回完了）");
            // 必要ならここで終了処理
        }
    }
    isTop = !isTop; // 表裏の反転
    updateScoreboard(); // 今の回を示すために更新
    updateRunnerDisplay();
}


/* =========================================
   8. 安打・ランナー処理
   ========================================= */
// 安打ボタン（簡易版：カウントリセットしてランナーを置く）
btnHitSingle.addEventListener('click', () => {
    resetCount();
    runners[0] = 1; // 一塁にランナー
    updateDisplay();
    updateRunnerDisplay();
    btnReturn.click();
});
// 他の安打ボタンも同様（必要なら自動進塁ロジックを追加可能）
btnHitDouble.addEventListener('click', () => { resetCount(); runners[1] = 1; updateDisplay(); updateRunnerDisplay(); btnReturn.click(); });
btnHitTriple.addEventListener('click', () => { resetCount(); runners[2] = 1; updateDisplay(); updateRunnerDisplay(); btnReturn.click(); });
btnHitHomerun.addEventListener('click', () => {
    resetCount();
    addScore(1 + runners.filter(r => r === 1).length); // ランナー分+1点を加算
    runners = [0, 0, 0]; // ランナー一掃
    updateDisplay();
    updateRunnerDisplay();
    btnReturn.click();
});


// --- ランナーの手動操作（ベースクリック） ---
// 1塁
document.getElementById('base-1').addEventListener('click', () => {
    runners[0] = runners[0] === 0 ? 1 : 0;
    updateRunnerDisplay();
});
// 2塁
document.getElementById('base-2').addEventListener('click', () => {
    runners[1] = runners[1] === 0 ? 1 : 0;
    updateRunnerDisplay();
});
// 3塁
document.getElementById('base-3').addEventListener('click', () => {
    runners[2] = runners[2] === 0 ? 1 : 0;
    updateRunnerDisplay();
});

// ランナー表示の更新
function updateRunnerDisplay() {
    document.getElementById('base-1').classList.toggle('runner-on', runners[0] === 1);
    document.getElementById('base-2').classList.toggle('runner-on', runners[1] === 1);
    document.getElementById('base-3').classList.toggle('runner-on', runners[2] === 1);
}


/* =========================================
   9. スコアボード更新処理
   ========================================= */
function addScore(points) {
    if (isTop) {
        topScores[currentInning - 1] += points;
    } else {
        bottomScores[currentInning - 1] += points;
    }
    updateScoreboard();
}

function updateScoreboard() {
    // 1〜7回までの表示更新
    for (let i = 1; i <= 7; i++) {
        // 先攻
        const tCell = document.getElementById(`t${i}`);
        if (tCell) tCell.textContent = topScores[i - 1];

        // 後攻
        const bCell = document.getElementById(`b${i}`);
        if (bCell) bCell.textContent = bottomScores[i - 1];

        // 現在のイニングを強調表示（CSSで .active-inning を定義しても良い）
        if (i === currentInning) {
            if (isTop) { tCell.style.backgroundColor = "#555"; bCell.style.backgroundColor = "transparent"; }
            else { bCell.style.backgroundColor = "#555"; tCell.style.backgroundColor = "transparent"; }
        } else {
            tCell.style.backgroundColor = "transparent";
            bCell.style.backgroundColor = "transparent";
        }
    }

    // 合計得点（reduceで合計を計算）
    const tTotal = topScores.reduce((sum, score) => sum + score, 0);
    const bTotal = bottomScores.reduce((sum, score) => sum + score, 0);

    document.getElementById('top-total').textContent = tTotal;
    document.getElementById('bottom-total').textContent = bTotal;
}


/* =========================================
   10. 描画ヘルパー関数
   ========================================= */
function updateDisplay() {
    renderDots('strike-dots', strikes, 'strike-on');
    renderDots('ball-dots', balls, 'ball-on');
    renderDots('out-dots', outs, 'out-on');
}

function renderDots(containerId, count, activeClass) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    for (let i = 0; i < count; i++) {
        const span = document.createElement('span');
        span.classList.add('dot', activeClass);
        container.appendChild(span);
    }
}