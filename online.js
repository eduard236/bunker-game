/* BUNKE/* BUNKER ONLINE v3.1 — комнаты на Firebase Realtime Database */
(function () {
const TRAIT_KEYS = [
  ['profession', 'Профессия'], ['health', 'Здоровье'], ['phobia', 'Фобия'],
  ['hobby', 'Хобби'], ['trait', 'Качество'], ['fact', 'Факт'], ['luggage', 'Багаж']
];

let myPid = localStorage.getItem('bunker-pid');
if (!myPid) { myPid = 'p' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4); localStorage.setItem('bunker-pid', myPid); }

let roomRef = null, roomCode = null, roomData = null;
const $on = (id) => document.getElementById(id);
const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function toast(t) { if (window.showToast) window.showToast(t); else alert(t); }
function copyText(t, msg) {
  const fb = () => { const ta = document.createElement('textarea'); ta.value = t; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); } catch (e) {} document.body.removeChild(ta); toast(msg); };
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(() => toast(msg)).catch(fb); else fb();
}
function genCode() { const abc = 'ABCEHKMPTXYZ23456789'; let s = ''; for (let i = 0; i < 5; i++) s += abc[Math.floor(Math.random() * abc.length)]; return s; }
const inviteLink = (c) => location.origin + location.pathname + '?room=' + c;

function playersByIndex(r) { const a = []; Object.keys(r.players || {}).forEach(pid => a.push(Object.assign({ pid }, r.players[pid]))); a.sort((x, y) => x.index - y.index); return a; }
const myIndex = () => (roomData.players && roomData.players[myPid]) ? roomData.players[myPid].index : -1;
const isHost = () => roomData.hostId === myPid;
const nameByIndex = (list, i) => (list[i] ? list[i].name : '—');

function backstoryTitle() { const bi = roomData.backstoryIndex || 1; return gameData.backstories[bi - 1] ? gameData.backstories[bi - 1].title : ''; }
function backstoryDesc() { const bi = roomData.backstoryIndex || 1; return gameData.backstories[bi - 1] ? gameData.backstories[bi - 1].description : ''; }

function backstoryOptions(sel) {
  let h = '<option value="0"' + (sel === 0 ? ' selected' : '') + '>Случайная предыстория</option>';
  gameData.backstories.forEach((b, i) => { h += '<option value="' + (i + 1) + '"' + (sel === i + 1 ? ' selected' : '') + '>' + esc(b.title) + '</option>'; });
  return h;
}

function enterRoom(code) {
  const onlineCounter = document.getElementById('bunker-online');
  if (onlineCounter) onlineCounter.style.display = 'none';
  roomCode = code;
  roomRef = firebase.database().ref('rooms/' + code);
  roomRef.on('value', (snap) => {
    roomData = snap.val();
    if (!roomData) { toast('Комната не найдена или удалена'); leaveRoom(true); return; }
    renderRoom();
  });
  try { history.replaceState(null, '', '?room=' + code); } catch (e) {}
}

function leaveRoom(silent) {
  const onlineCounter = document.getElementById('bunker-online');
  if (onlineCounter) onlineCounter.style.display = 'flex';
  if (roomRef) roomRef.off();
  roomRef = null; roomData = null; roomCode = null;
  try { history.replaceState(null, '', location.pathname); } catch (e) {}
  if (!silent) location.reload();
}

window.createRoomOnline = function () {
  if (!window.FB_OK) { toast('Онлайн не настроен: проверь файл firebase-config.js'); return; }
  const name = (prompt('Ваше имя?') || '').trim(); if (!name) return;
  const code = genCode();
  const up = { createdAt: Date.now(), hostId: myPid, status: 'lobby', backstoryIndex: 0 };
  up['players/' + myPid] = { name, index: 0, seen: 0 };
  firebase.database().ref('rooms/' + code).update(up).then(() => enterRoom(code)).catch(e => toast('Ошибка создания: ' + e.message));
};

window.joinRoomOnline = function (codeArg) {
  if (!window.FB_OK) { toast('Онлайн не настроен: проверь файл firebase-config.js'); return; }
  const code = (codeArg || prompt('Код комнаты (например AB12C)?') || '').trim().toUpperCase(); if (!code) return;
  const ref = firebase.database().ref('rooms/' + code);
  ref.once('value').then((snap) => {
    const r = snap.val();
    if (!r) { toast('Комната с таким кодом не найдена'); return; }
    if (r.players && r.players[myPid]) { enterRoom(code); return; }
    if (r.status !== 'lobby') { toast('В этой комнате игра уже идёт — присоединиться нельзя'); return; }
    const name = (prompt('Ваше имя?') || '').trim(); if (!name) return;
    const count = r.players ? Object.keys(r.players).length : 0;
    if (count >= 15) { toast('Комната заполнена (максимум 15)'); return; }
    ref.child('players/' + myPid).set({ name, index: count, seen: 0 }).then(() => enterRoom(code));
  }).catch(e => toast('Ошибка подключения: ' + e.message));
};

function showMissionModal(m, onAccept) {
  const modal = document.createElement('div');
  modal.className = 'modal mission-modal'; modal.style.display = 'block';
  modal.innerHTML = '<div class="modal-content mission-content-box"><span class="close-mission">×</span>' +
    '<h2>🎯 СЕКРЕТНАЯ МИССИЯ</h2><div class="mission-type-badge-large">' + esc(m.name) + '</div>' +
    '<div class="rules-section"><h3 class="mission-title">' + esc(m.description) + '</h3><div class="mission-details">' + esc(m.details) + '</div></div>' +
    '<div class="mission-warning-orange"><p>⚠️ НИКОМУ не показывайте эту миссию!</p></div>' +
    '<button class="action-btn accept-mission-btn">' + (onAccept ? 'Понятно, миссия принята!' : 'Закрыть') + '</button></div>';
  document.body.appendChild(modal);
  const close = () => modal.remove();
  modal.querySelector('.close-mission').addEventListener('click', close);
  modal.querySelector('.accept-mission-btn').addEventListener('click', () => { if (onAccept) onAccept(); close(); });
  modal.addEventListener('click', (e) => { if (e.target === modal) close(); });
}

function startOnlineGame() {
  const list = playersByIndex(roomData); const n = list.length;
  const pools = { profession: shuffle([...gameData.professions]), health: shuffle([...gameData.health]), phobia: shuffle([...gameData.phobias]), hobby: shuffle([...gameData.hobbies]), trait: shuffle([...gameData.traits]), fact: shuffle([...gameData.facts]), luggage: shuffle([...gameData.luggage]) };
  const take = (pool, all) => (pool.length ? pool.pop() : all[Math.floor(Math.random() * all.length)]).trim();
  const roles = {};
  for (let i = 0; i < n; i++) roles[i] = { profession: take(pools.profession, gameData.professions), health: take(pools.health, gameData.health), phobia: take(pools.phobia, gameData.phobias), hobby: take(pools.hobby, gameData.hobbies), trait: take(pools.trait, gameData.traits), fact: take(pools.fact, gameData.facts), luggage: take(pools.luggage, gameData.luggage) };
  const arr = []; for (let i = 0; i < n; i++) arr.push(roles[i]);
  const ms = new SecretMissionSystem(); ms.generateMissions(arr);
  const missions = {};
  ms.missions.forEach(m => { missions[m.playerIndex] = { type: m.type, name: m.name, description: m.description, details: m.details, targetPlayerIndex: m.targetPlayerIndex, targetTrait: m.targetTrait }; });
  let bi = roomData.backstoryIndex || 0;
  if (bi === 0) bi = 1 + Math.floor(Math.random() * gameData.backstories.length);
  roomRef.update({ roles, missions, backstoryIndex: bi, status: 'missions' });
}

function renderRoom() {
  const mc = document.querySelector('.main-content'); if (!mc) return;
  if (!roomData.players || !roomData.players[myPid]) {
    mc.innerHTML = '<div class="online-screen"><h2>Вы не в комнате</h2><p>Возможно, комната создана в другом браузере или вы вышли из неё.</p><div class="game-actions"><button class="action-btn" id="olBack">🏠 В меню</button></div></div>';
    $on('olBack').addEventListener('click', () => leaveRoom()); return;
  }
  if (roomData.status === 'lobby') return renderLobby(mc);
  if (roomData.status === 'missions') return renderMissions(mc);
  if (roomData.status === 'game') return renderGame(mc);
  if (roomData.status === 'finished') return renderFinished(mc);
}

function renderLobby(mc) {
  const list = playersByIndex(roomData); const link = inviteLink(roomCode);
  mc.innerHTML = '<div class="online-screen"><h2>🌐 Комната ' + roomCode + '</h2>' +
    '<div class="invite-box"><p>Отправьте друзьям ссылку или код:</p><div class="invite-line"><span class="invite-link">' + esc(link) + '</span>' +
    '<button class="action-btn" id="olCopyLink">📋 Ссылка</button><button class="action-btn" id="olCopyCode">🔑 Код ' + roomCode + '</button></div></div>' +
    '<div class="lobby-players"><h3>Выжившие (' + list.length + '/15):</h3>' +
    list.map(p => '<div class="lobby-player">' + (p.index + 1) + '. ' + esc(p.name) + (p.pid === myPid ? ' (вы)' : '') + (p.pid === roomData.hostId ? ' 👑' : '') + '</div>').join('') + '</div>' +
    (isHost()
      ? '<div class="setting-card"><h3>Предыстория</h3><select id="olBackstory">' + backstoryOptions(roomData.backstoryIndex || 0) + '</select></div>' +
        '<div class="game-actions"><button class="action-btn" id="olStart"' + (list.length < 2 ? ' disabled' : '') + '>▶ Начать игру (' + list.length + ', мин. 2)</button></div>' +
        (list.length < 2 ? '<p class="online-hint">Нужно минимум 2 игрока.</p>' : '')
      : '<p class="online-hint">Ждём, пока хост начнёт игру…</p>') +
    '<div class="game-actions"><button class="action-btn" id="olLeave">🚪 Выйти</button></div></div>';
  $on('olCopyLink').addEventListener('click', () => copyText(link, 'Ссылка скопирована'));
  $on('olCopyCode').addEventListener('click', () => copyText(roomCode, 'Код скопирован'));
  $on('olLeave').addEventListener('click', () => leaveRoom());
  if (isHost()) {
    $on('olBackstory').addEventListener('change', (e) => roomRef.update({ backstoryIndex: parseInt(e.target.value, 10) }));
    const st = $on('olStart'); if (st) st.addEventListener('click', startOnlineGame);
  }
}

function renderMissions(mc) {
  const idx = myIndex(); const me = roomData.players[myPid];
  const myMission = roomData.missions ? roomData.missions[idx] : null;
  const list = playersByIndex(roomData);
  const seen = list.filter(p => p.seen).length;
  mc.innerHTML = '<div class="online-screen"><h2>🔒 Секретные миссии</h2><p class="online-ok">' + esc(backstoryTitle()) + '</p><div class="backstory-card"><p>' + esc(backstoryDesc()) + '</p></div>' +
    (myMission
      ? (me.seen ? '<p class="online-ok">✔ Миссия принята. Держите её в секрете!</p>'
        : '<div class="game-actions"><button class="action-btn gold" id="olViewMission">🎯 Посмотреть мою секретную миссию</button></div>')
      : '<p class="online-hint">В этом раунде у вас нет секретной миссии — играйте как обычно.</p>') +
    (isHost()
      ? '<p class="online-hint">Миссии посмотрели: ' + seen + '/' + list.length + '</p><div class="game-actions"><button class="action-btn" id="olToGame">▶ Начать обсуждение</button></div>'
      : '<p class="online-hint">Ждём хоста…</p>') +
    '<div class="game-actions"><button class="action-btn" id="olLeave">🚪 Выйти</button></div></div>';
  const vm = $on('olViewMission');
  if (vm) vm.addEventListener('click', () => showMissionModal(myMission, () => roomRef.child('players/' + myPid + '/seen').set(1)));
  const tg = $on('olToGame'); if (tg) tg.addEventListener('click', () => roomRef.update({ status: 'game' }));
  $on('olLeave').addEventListener('click', () => leaveRoom());
}

function renderGame(mc) {
  const idx = myIndex(); const list = playersByIndex(roomData); const n = list.length;
  const roles = roomData.roles || {}; const reveals = roomData.reveals || {}; const exiled = roomData.exiled || {};
  const exCount = Object.keys(exiled).length; const endN = Math.max(1, Math.ceil(n / 2));
  const done = (n - exCount) <= endN;
  const myMission = roomData.missions ? roomData.missions[idx] : null;
  let cards = '';
  for (let i = 0; i < n; i++) {
    const p = list[i]; const role = roles[i] || {}; const rev = reveals[i] || {};
    const isMe = i === idx; const isEx = !!exiled[i];
    let rows = '';
    TRAIT_KEYS.forEach(([key, label]) => {
      const visible = isMe || rev[key];
      rows += '<div class="trait online-trait"><strong>' + label + ':</strong> ' +
        (visible ? '<span class="trait-val">' + esc(role[key]) + '</span>' : '<span class="trait-hidden">???</span>') +
        (isMe && !rev[key] ? ' <button class="reveal-btn" data-key="' + key + '">👁 открыть всем</button>' : '') +
        (rev[key] ? ' <span class="revealed-mark" title="Видно всем">👁</span>' : '') + '</div>';
    });
    cards += '<div class="player-card ' + (isEx ? 'exiled' : '') + '"><div class="player-header"><h3>Игрок ' + (i + 1) + ' · ' + esc(p.name) + '</h3><span class="player-number">#' + (i + 1) + '</span>' +
      (isMe && myMission ? '<button class="secret-mission-btn" id="olMyMission">🎯 Моя миссия</button>' : '') + '</div>' + rows +
      '<div class="card-actions">' + (isHost() ? '<button class="exile-btn" data-idx="' + i + '">' + (isEx ? '↩ Вернуть' : '🚪 Изгнать') + '</button>' : (isEx ? '<div class="exiled-mark">🚪 Изгнан</div>' : '')) + '</div></div>';
  }
  mc.innerHTML = '<div class="game-screen"><div class="backstory-card"><h2>' + esc(backstoryTitle()) + '</h2><p>' + esc(backstoryDesc()) + '</p></div>' +
    '<div class="game-status"><span>Выживших: ' + (n - exCount) + ' из ' + n + '</span><span class="status-hint">' + (done ? 'Бункер опечатан — хост подводит итоги' : 'Конец игры при ≤ ' + endN + ' выживших') + '</span>' +
    (isHost() ? '<span><button class="action-btn" id="olResults"' + (done ? '' : ' hidden') + '>🏁 Итоги</button></span>' : '') + '</div>' +
    '<div class="players-grid">' + cards + '</div>' +
    '<div class="game-actions"><button class="action-btn" id="olLeave">🚪 Выйти</button></div></div>';
  mc.querySelectorAll('.reveal-btn').forEach(b => b.addEventListener('click', () => roomRef.child('reveals/' + idx + '/' + b.dataset.key).set(1)));
  mc.querySelectorAll('.exile-btn').forEach(b => b.addEventListener('click', () => {
    const i = b.dataset.idx;
    if (exiled[i]) roomRef.child('exiled/' + i).remove(); else roomRef.child('exiled/' + i).set(1);
  }));
  const mm = $on('olMyMission'); if (mm) mm.addEventListener('click', () => showMissionModal(myMission, null));
  const rb = $on('olResults'); if (rb) rb.addEventListener('click', () => roomRef.update({ status: 'finished' }));
  $on('olLeave').addEventListener('click', () => leaveRoom());
}

function renderFinished(mc) {
  const list = playersByIndex(roomData); const exiled = roomData.exiled || {}; const missions = roomData.missions || {};
  const outcomes = { success: ['✅ УСПЕХ', 'outcome-success'], partial: ['⚠️ ЧАСТИЧНЫЙ УСПЕХ', 'outcome-partial'], fail: ['❌ ПРОВАЛ', 'outcome-fail'] };
  let html = '';
  Object.keys(missions).forEach(k => {
    const m = missions[k]; const holderEx = !!exiled[m.playerIndex]; const targetEx = !!exiled[m.targetPlayerIndex];
    let res;
    if (m.type === 'TRAITOR') res = (targetEx && !holderEx) ? 'success' : (targetEx ? 'partial' : 'fail');
    else res = targetEx ? 'fail' : (holderEx ? 'partial' : 'success');
    const [txt, cls] = outcomes[res];
    html += '<div class="result-card ' + cls + '"><div class="result-head">Игрок ' + (m.playerIndex + 1) + ' (' + esc(nameByIndex(list, m.playerIndex)) + ') · «' + esc(m.name) + '»</div>' +
      '<p class="result-text">' + esc(m.description) + '</p>' +
      '<p class="result-target">Цель: игрок ' + (m.targetPlayerIndex + 1) + ' (' + esc(nameByIndex(list, m.targetPlayerIndex)) + ') — ' + (targetEx ? 'изгнан' : 'в бункере') + ' · Носитель: ' + (holderEx ? 'изгнан' : 'в бункере') + '</p>' +
      '<div class="result-badge">' + txt + '</div></div>';
  });
  mc.innerHTML = '<div class="results-screen"><h2>🏁 ИТОГИ ИГРЫ</h2><p class="results-summary">Выживших: ' + (list.length - Object.keys(exiled).length) + ' из ' + list.length + ' · Раскрыто миссий: ' + Object.keys(missions).length + '</p>' +
    '<div class="results-list">' + (html || '<p>Миссий не было.</p>') + '</div>' +
    '<div class="game-actions">' + (isHost() ? '<button class="action-btn" id="olLobby">🔄 Новый раунд</button>' : '') + '<button class="action-btn" id="olLeave">🚪 Выйти</button></div></div>';
  const lb = $on('olLobby');
  if (lb) lb.addEventListener('click', () => {
    const up = { status: 'lobby', roles: null, missions: null, reveals: null, exiled: null };
    Object.keys(roomData.players).forEach(pid => { up['players/' + pid + '/seen'] = 0; });
    roomRef.update(up);
  });
  $on('olLeave').addEventListener('click', () => leaveRoom());
}

document.addEventListener('DOMContentLoaded', () => {
  const bc = $on('createRoomBtn'), bj = $on('joinRoomBtn');
  if (bc) bc.addEventListener('click', () => window.createRoomOnline());
  if (bj) bj.addEventListener('click', () => window.joinRoomOnline());
  if (location.search.indexOf('room=') !== -1) {
  const onlineCounter = document.getElementById('bunker-online');
  if (onlineCounter) onlineCounter.style.display = 'none';
  }
  const m = location.search.match(/room=([A-Za-z0-9]+)/);
  if (m) { if (window.FB_OK) window.joinRoomOnline(m[1]); else toast('Онлайн не настроен: проверь файл firebase-config.js'); }

// ============ РЕАЛЬНЫЙ СЧЁТЧИК ОНЛАЙНА ============
if (window.FB_OK) {
  const presenceRef = firebase.database().ref('/presence/' + myPid);
  const connectedRef = firebase.database().ref('.info/connected');

  // Когда пользователь заходит на сайт, записываем его в базу
  connectedRef.on('value', (snap) => {
    if (snap.val() === true) {
      // Если он закрыл вкладку, запись удалится сама
      presenceRef.onDisconnect().remove();
      presenceRef.set(true);
    }
  });

  // Следим за количеством людей в базе и обновляем счётчик
  firebase.database().ref('/presence').on('value', (snap) => {
    const count = snap.numChildren();
    const el = document.getElementById('onlineCount');
    if (el) el.textContent = count;
  });
}
});
})();