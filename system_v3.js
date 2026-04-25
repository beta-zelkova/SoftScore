// ============================================================
//  State
// ============================================================
let balls   = 0;
let strikes = 0;
let outs    = 0;
let runners = [0, 0, 0]; // [1塁, 2塁, 3塁]

let startTime     = null;
let timerInterval = null;

let topScores    = [];
let bottomScores = [];
let currentInning = 1;
let isTop = true;

// アウト入力の状態管理
let pendingOutType  = null; // 'GO' | 'F' | 'L' | 'K'
let fielderSequence = [];   // [6, 4, 3] など

// 安打入力の状態管理
let pendingHitType = null;  // '1B' | '2B' | '3B' | 'HR'

// ============================================================
//  DOM refs
// ============================================================
const timeStart          = document.getElementById('time-start');
const timeReset          = document.getElementById('time-reset');
const displayStartTime   = document.getElementById('displayStartTime');
const displayElapsedTime = document.getElementById('displayElapsedTime');

const areaPitchResult = document.getElementById('pitch-result');
const btnReturn       = document.getElementById('input-return');
const btnMenuBSO      = document.getElementById('BSO');
const btnMenuOUT      = document.getElementById('OUT');
const btnMenuHIT      = document.getElementById('HIT');

const areaBSO    = document.getElementById('BSO-detail');
const areaOutType    = document.getElementById('out-type');
const areaFielder    = document.getElementById('fielder-panel');
const fielderPreview = document.getElementById('fielder-preview');
const fielderHint    = document.getElementById('fielder-hint');
const fielderUndo    = document.getElementById('fielder-undo');
const fielderConfirm = document.getElementById('fielder-confirm');

const areaHitType      = document.getElementById('hit-type');
const areaHitDirection = document.getElementById('hit-direction');

const playLog  = document.getElementById('play-log');
const logClear = document.getElementById('log-clear');

// すべてのサブパネル
const allAreas = [areaBSO, areaOutType, areaFielder, areaHitType, areaHitDirection];

// ============================================================
//  Timer
// ============================================================
timeStart.addEventListener('click', () => {
    startTime = new Date();
    const h = startTime.getHours().toString().padStart(2, '0');
    const m = startTime.getMinutes().toString().padStart(2, '0');
    displayStartTime.textContent = `${h}:${m}`;
    updateTimer();
    timerInterval = setInterval(updateTimer, 60000);
    timeStart.disabled    = true;
    timeStart.textContent = '試合中';
    setGameButtonsDisabled(false);
});

function updateTimer() {
    if (!startTime) return;
    const minutes = Math.floor((new Date() - startTime) / 60000);
    displayElapsedTime.textContent = `${minutes}分`;
}

timeReset.addEventListener('click', () => {
    clearInterval(timerInterval);
    timerInterval = null;
    startTime = null;
    displayStartTime.textContent   = '-:-';
    displayElapsedTime.textContent = '開始前';
    timeStart.disabled    = false;
    timeStart.textContent = '試合開始';
    setGameButtonsDisabled(true);
});

// ============================================================
//  Scoreboard
// ============================================================
function ensureInning(inning) {
    while (topScores.length    < inning) topScores.push(0);
    while (bottomScores.length < inning) bottomScores.push(0);
}

function updateScoreboard() {
    ensureInning(currentInning);
    const topTotal    = topScores.reduce((s, v) => s + v, 0);
    const bottomTotal = bottomScores.reduce((s, v) => s + v, 0);
    const totalInnings = Math.max(topScores.length, 7);

    const thead = document.getElementById('scoreboard-head');
    let headHtml = '<tr><th>チーム</th>';
    for (let i = 1; i <= totalInnings; i++) headHtml += `<th>${i}</th>`;
    headHtml += '<th class="total">R</th></tr>';
    thead.innerHTML = headHtml;

    let topRow = '<tr><td class="team-name">先攻</td>';
    for (let i = 1; i <= totalInnings; i++) {
        const score  = topScores[i - 1] ?? 0;
        const active = i === currentInning && isTop ? ' class="active-inning"' : '';
        topRow += `<td${active}>${score}</td>`;
    }
    topRow += `<td class="total">${topTotal}</td></tr>`;

    let botRow = '<tr><td class="team-name">後攻</td>';
    for (let i = 1; i <= totalInnings; i++) {
        const score  = bottomScores[i - 1] ?? 0;
        const active = i === currentInning && !isTop ? ' class="active-inning"' : '';
        botRow += `<td${active}>${score}</td>`;
    }
    botRow += `<td class="total">${bottomTotal}</td></tr>`;

    document.getElementById('scoreboard-body').innerHTML = topRow + botRow;
}

// ============================================================
//  Navigation helpers
// ============================================================
function showOnly(area) {
    areaPitchResult.classList.add('hidden');
    allAreas.forEach(a => a.classList.add('hidden'));
    if (area) area.classList.remove('hidden');
}

function returnToMain() {
    allAreas.forEach(a => a.classList.add('hidden'));
    areaPitchResult.classList.remove('hidden');
    pendingOutType  = null;
    pendingHitType  = null;
    fielderSequence = [];
    updateDisplay();
}

btnReturn.addEventListener('click', returnToMain);
btnMenuBSO.addEventListener('click', () => showOnly(areaBSO));
btnMenuOUT.addEventListener('click', () => showOnly(areaOutType));
btnMenuHIT.addEventListener('click', () => showOnly(areaHitType));

// ============================================================
//  BSO
// ============================================================
function addStrike(label) {
    strikes++;
    if (strikes >= 3) {
        resetCount();
        addOut();
        addLog('out', label === 'swing' ? 'K' : '見逃し三振', null);
        returnToMain();
        return;
    }
    updateDisplay();
}

document.getElementById('btn-looking').addEventListener('click', () => addStrike('looking'));
document.getElementById('btn-swing').addEventListener('click', () => addStrike('swing'));

document.getElementById('btn-foul').addEventListener('click', () => {
    if (strikes < 2) strikes++;
    updateDisplay();
});

document.getElementById('btn-ball').addEventListener('click', () => {
    balls++;
    if (balls >= 4) {
        resetCount();
        advanceRunnersOnWalk();
        updateRunnerDisplay();
        addLog('walk', 'BB', null);
        returnToMain();
        return;
    }
    updateDisplay();
});

function advanceRunnersOnWalk() {
    if (runners[0] === 1 && runners[1] === 1 && runners[2] === 1) addScore(1);
    if (runners[0] === 1 && runners[1] === 1) runners[2] = 1;
    if (runners[0] === 1) runners[1] = 1;
    runners[0] = 1;
}

function resetCount() { strikes = 0; balls = 0; }

// ============================================================
//  Out — Step 1: 種別選択
// ============================================================
areaOutType.querySelectorAll('[data-out-type]').forEach(btn => {
    btn.addEventListener('click', () => {
        const type = btn.dataset.outType;

        if (type === 'K') {
            // 三振はそのまま確定（アウトカウント増加）
            addOut(); resetCount();
            addLog('out', 'K', null);
            returnToMain();
            return;
        }

        if (type === 'E') {
            // エラー: アウトにはならないが守備番号を記録
            // → アウトカウントは増やさずカウントリセット、ランナーは手動で調整
            pendingOutType  = 'E';
            fielderSequence = [];
            updateFielderPreview();
            fielderHint.textContent = 'エラーした守備番号をタップ（例: E6）';
            showOnly(areaFielder);
            return;
        }

        // ゴロ/フライ/ライナー → 守備番号入力へ
        pendingOutType  = type;
        fielderSequence = [];
        updateFielderPreview();
        fielderHint.textContent =
            type === 'GO' ? '処理した守備番号を順にタップ（例: 6→3）' :
            type === 'F'  ? '捕球した守備番号をタップ（例: F8）' :
                            '捕球した守備番号をタップ（例: L6）';
        showOnly(areaFielder);
    });
});

// ============================================================
//  Out — Step 2: 守備番号入力
// ============================================================
areaFielder.querySelectorAll('.fnum').forEach(btn => {
    btn.addEventListener('click', () => {
        fielderSequence.push(Number(btn.dataset.pos));
        updateFielderPreview();
    });
});

fielderUndo.addEventListener('click', () => {
    fielderSequence.pop();
    updateFielderPreview();
});

fielderConfirm.addEventListener('click', () => {
    if (fielderSequence.length === 0) return;

    const notation = buildOutNotation(pendingOutType, fielderSequence);

    if (pendingOutType === 'E') {
        // エラーはアウトにならない・カウントリセットのみ
        resetCount();
        addLog('error', notation, null);
    } else {
        addOut();
        resetCount();
        addLog('out', notation, null);
    }
    returnToMain();
});

function buildOutNotation(type, seq) {
    const path = seq.join('-');
    if (type === 'F')  return `F${seq[0]}`;      // フライ: F8
    if (type === 'L')  return `L${seq[0]}`;      // ライナー: L6
    if (type === 'E')  return `E${seq[0]}`;      // エラー: E6
    if (type === 'GO') return path;               // ゴロ: 6-3, 5-4-3
    return path;
}

function updateFielderPreview() {
    if (fielderSequence.length === 0) {
        fielderPreview.textContent = '-';
        fielderPreview.classList.remove('has-value');
    } else {
        const notation = buildOutNotation(pendingOutType, fielderSequence);
        fielderPreview.textContent = notation;
        fielderPreview.classList.add('has-value');
    }
}

function addOut() {
    outs++;
    updateDisplay();
    if (outs >= 3) {
        outs    = 0;
        runners = [0, 0, 0];
        changeInning();
    }
}

function changeInning() {
    if (!isTop) currentInning++;
    isTop = !isTop;
    ensureInning(currentInning);
    updateScoreboard();
    updateRunnerDisplay();
    updateDisplay();
}

// ============================================================
//  Hit — Step 1: 種別選択
// ============================================================
areaHitType.querySelectorAll('[data-hit-type]').forEach(btn => {
    btn.addEventListener('click', () => {
        pendingHitType = btn.dataset.hitType;

        if (pendingHitType === 'HR') {
            // 本塁打は方向なしで確定
            const scored = 1 + runners.filter(r => r === 1).length;
            addScore(scored);
            runners = [0, 0, 0];
            resetCount();
            addLog('hit', 'HR', null);
            updateDisplay(); updateRunnerDisplay();
            returnToMain();
            return;
        }

        showOnly(areaHitDirection);
    });
});

// ============================================================
//  Hit — Step 2: 方向選択
// ============================================================
areaHitDirection.querySelectorAll('[data-dir]').forEach(btn => {
    btn.addEventListener('click', () => {
        const dir = btn.dataset.dir;
        applyHit(pendingHitType, dir);
    });
});

function applyHit(type, dir) {
    resetCount();

    // 走者進塁
    if (type === '1B') {
        if (runners[2] === 1) addScore(1);
        runners[2] = runners[1];
        runners[1] = runners[0];
        runners[0] = 1;
    } else if (type === '2B') {
        if (runners[2] === 1) addScore(1);
        if (runners[1] === 1) addScore(1);
        runners[2] = runners[0];
        runners[1] = 1;
        runners[0] = 0;
    } else if (type === '3B') {
        const scored = runners.filter(r => r === 1).length;
        if (scored > 0) addScore(scored);
        runners = [0, 0, 1];
    }

    // 方向表記を組み立て (例: 1B左中, 2B右中間)
    const notation = `${type} ${dir}`;
    addLog('hit', notation, null);

    updateDisplay();
    updateRunnerDisplay();
    returnToMain();
}

// ============================================================
//  Manual runner toggle
// ============================================================
document.getElementById('base-1').addEventListener('click', () => { runners[0] ^= 1; updateRunnerDisplay(); });
document.getElementById('base-2').addEventListener('click', () => { runners[1] ^= 1; updateRunnerDisplay(); });
document.getElementById('base-3').addEventListener('click', () => { runners[2] ^= 1; updateRunnerDisplay(); });

function updateRunnerDisplay() {
    document.getElementById('base-1').classList.toggle('runner-on', runners[0] === 1);
    document.getElementById('base-2').classList.toggle('runner-on', runners[1] === 1);
    document.getElementById('base-3').classList.toggle('runner-on', runners[2] === 1);
}

// ============================================================
//  Score
// ============================================================
function addScore(points) {
    ensureInning(currentInning);
    if (isTop) topScores[currentInning - 1]    += points;
    else        bottomScores[currentInning - 1] += points;
    updateScoreboard();
}

// ============================================================
//  Display
// ============================================================
function updateDisplay() {
    renderDots('strike-dots', strikes, 3, 'strike-on');
    renderDots('ball-dots',   balls,   4, 'ball-on');
    renderDots('out-dots',    outs,    3, 'out-on');
}

function renderDots(containerId, count, max, activeClass) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    for (let i = 0; i < max; i++) {
        const span = document.createElement('span');
        span.classList.add('dot');
        if (i < count) span.classList.add(activeClass);
        container.appendChild(span);
    }
}

// ============================================================
//  Play Log
// ============================================================
const TYPE_STYLE = {
    out:   { color: '#e84a4a', label: 'OUT' },
    hit:   { color: '#4ae8a0', label: 'HIT' },
    walk:  { color: '#4ab8e8', label: 'BB'  },
    error: { color: '#e8944a', label: 'E'   },
};

function inningLabel() {
    return `${currentInning}回${isTop ? '表' : '裏'}`;
}

function addLog(type, notation, _dir) {
    const empty = playLog.querySelector('.log-empty');
    if (empty) empty.remove();

    const style = TYPE_STYLE[type] || { color: '#aaa', label: type };
    const time  = startTime
        ? (() => { const d = new Date(); return `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`; })()
        : '--:--';

    const entry = document.createElement('div');
    entry.className = 'log-entry';
    entry.innerHTML = `
        <span class="log-badge" style="background:${style.color}22;color:${style.color}">${style.label}</span>
        <span class="log-inning">${inningLabel()}</span>
        <span class="log-notation">${notation}</span>
        <span class="log-time">${time}</span>
    `;
    playLog.insertBefore(entry, playLog.firstChild);
}

logClear.addEventListener('click', () => {
    playLog.innerHTML = '<p class="log-empty">まだ記録がありません</p>';
});

// ============================================================
//  Utility
// ============================================================
function setGameButtonsDisabled(disabled) {
    [btnMenuBSO, btnMenuOUT, btnMenuHIT].forEach(b => b.disabled = disabled);
}

// ============================================================
//  Init
// ============================================================
ensureInning(1);
setGameButtonsDisabled(true);
updateDisplay();
updateScoreboard();
updateRunnerDisplay();
