/* ====================================================
   DEATH NOTE • REPLICA EXACTA CON BASE DE DATOS Y PRIVACIDAD
   - Carga automática desde el repositorio (data/entries.json)
   - Contraseña para registros privados
   ==================================================== */

// --- Estado Global ---
const STORAGE_KEY = 'death_note_replica_db_v6';
let entries = [];
let activeEntryId = null;
let currentFilter = 'all'; // 'all', 'public', 'private'
let pendingUnlockEntry = null;
let soundEnabled = true;
let isBookOpen = false;

// --- Elementos DOM ---
const sceneStage = document.getElementById('scene-stage');
const bookWrapper = document.getElementById('death-book-3d-wrapper');
const bookCube = document.getElementById('death-book-cube');
const specularGlare = document.getElementById('specular-glare');
const openDirectBtn = document.getElementById('open-direct-btn');
const hangNecklaceBtn = document.getElementById('hang-necklace-btn');
const openTabsGroup = document.getElementById('open-tabs-group');
const closeBookBtn = document.getElementById('close-book-btn');
const exportBtn = document.getElementById('export-btn');
const soundToggle = document.getElementById('sound-toggle');
const soundIcon = document.getElementById('sound-icon');
const quillPen = document.getElementById('quill-pen');
const toastNotify = document.getElementById('toast-notify');

// Pestañas de la Página Negra
const tabRulesBtn = document.getElementById('tab-rules-btn');
const tabMemosBtn = document.getElementById('tab-memos-btn');
const rulesView = document.getElementById('rules-view');
const memosView = document.getElementById('memos-view');
const tabCount = document.getElementById('tab-count');

// Filtros
const filterAll = document.getElementById('filter-all');
const filterPublic = document.getElementById('filter-public');
const filterPrivate = document.getElementById('filter-private');

// Formulario y Notas
const noteForm = document.getElementById('note-form');
const entryIdInput = document.getElementById('entry-id');
const entryTitleInput = document.getElementById('entry-title');
const entryContentInput = document.getElementById('entry-content');
const autoDateSpan = document.getElementById('auto-date');
const privateToggle = document.getElementById('private-toggle');
const toggleLabel = document.getElementById('toggle-label');
const passwordFieldWrap = document.getElementById('password-field-wrap');
const entryPasswordInput = document.getElementById('entry-password');
const entriesListEl = document.getElementById('entries-list');
const entryCountEl = document.getElementById('entry-count');
const newEntryBtn = document.getElementById('new-entry-btn');
const deleteBtn = document.getElementById('delete-btn');
const searchInput = document.getElementById('search-input');

// Modal Desbloqueo Contraseña
const unlockModal = document.getElementById('unlock-modal');
const unlockPassInput = document.getElementById('unlock-pass-input');
const unlockErrorMsg = document.getElementById('unlock-error-msg');
const cancelUnlockBtn = document.getElementById('cancel-unlock-btn');
const confirmUnlockBtn = document.getElementById('confirm-unlock-btn');

// SVG del Cordón
const cordSvg = document.getElementById('dynamic-cord-svg');
const svgCordLeftShadow = document.getElementById('svg-cord-left-shadow');
const svgCordRightShadow = document.getElementById('svg-cord-right-shadow');
const svgCordLeftBase = document.getElementById('svg-cord-left-base');
const svgCordLeftTexture = document.getElementById('svg-cord-left-texture');
const svgCordLeftShine = document.getElementById('svg-cord-left-shine');
const svgCordRightBase = document.getElementById('svg-cord-right-base');
const svgCordRightTexture = document.getElementById('svg-cord-right-texture');
const svgCordRightShine = document.getElementById('svg-cord-right-shine');
const svgRingGroup = document.getElementById('svg-ring-group');

// Canvas Ambiental
const ambientCanvas = document.getElementById('ambient-canvas');

// ====================================================
// 1. SISTEMA DE AUDIO (Campanitas Melódicas)
// ====================================================
let audioCtx = null;

function initAudio() {
  if (!audioCtx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) audioCtx = new AudioContext();
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

function playBellNote(freq, startTime, duration = 1.2, volume = 0.22) {
  if (!audioCtx) return;

  const osc1 = audioCtx.createOscillator();
  const gain1 = audioCtx.createGain();
  osc1.type = 'sine';
  osc1.frequency.setValueAtTime(freq, startTime);

  const osc2 = audioCtx.createOscillator();
  const gain2 = audioCtx.createGain();
  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(freq * 2.01, startTime);

  gain1.gain.setValueAtTime(0.001, startTime);
  gain1.gain.linearRampToValueAtTime(volume, startTime + 0.02);
  gain1.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

  gain2.gain.setValueAtTime(0.001, startTime);
  gain2.gain.linearRampToValueAtTime(volume * 0.35, startTime + 0.015);
  gain2.gain.exponentialRampToValueAtTime(0.0001, startTime + (duration * 0.7));

  osc1.connect(gain1);
  osc2.connect(gain2);
  gain1.connect(audioCtx.destination);
  gain2.connect(audioCtx.destination);

  osc1.start(startTime);
  osc2.start(startTime);
  osc1.stop(startTime + duration);
  osc2.stop(startTime + duration);
}

function playPaperRustle(startTime, duration = 0.45) {
  if (!audioCtx) return;
  const bufferSize = audioCtx.sampleRate * duration;
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * 0.12;
  }

  const noise = audioCtx.createBufferSource();
  noise.buffer = buffer;

  const filter = audioCtx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(800, startTime);
  filter.frequency.linearRampToValueAtTime(350, startTime + duration);

  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(0.001, startTime);
  gain.gain.linearRampToValueAtTime(0.08, startTime + 0.04);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(audioCtx.destination);

  noise.start(startTime);
}

function playMagicalSound(type) {
  if (!soundEnabled) return;
  initAudio();
  if (!audioCtx) return;

  const now = audioCtx.currentTime;

  if (type === 'drop') {
    playBellNote(659.25, now, 1.2, 0.16);
    playBellNote(987.77, now + 0.12, 1.4, 0.13);
  } else if (type === 'open') {
    playPaperRustle(now, 0.55);
    playBellNote(554.37, now + 0.04, 1.3, 0.2);
    playBellNote(659.25, now + 0.16, 1.3, 0.22);
    playBellNote(830.61, now + 0.28, 1.4, 0.25);
    playBellNote(1108.73, now + 0.42, 1.6, 0.28);
  } else if (type === 'close') {
    playPaperRustle(now, 0.4);
    playBellNote(830.61, now + 0.04, 1.0, 0.18);
    playBellNote(659.25, now + 0.16, 1.2, 0.18);
    playBellNote(554.37, now + 0.28, 1.4, 0.16);
  } else if (type === 'save') {
    playBellNote(987.77, now, 1.0, 0.2);
    playBellNote(1318.51, now + 0.12, 1.3, 0.24);
    playBellNote(1661.22, now + 0.24, 1.5, 0.25);
  } else if (type === 'delete') {
    playBellNote(440.0, now, 0.8, 0.15);
    playBellNote(392.0, now + 0.14, 1.0, 0.12);
  }
}

soundToggle.addEventListener('click', (e) => {
  e.stopPropagation();
  initAudio();
  soundEnabled = !soundEnabled;
  soundIcon.textContent = soundEnabled ? '✨' : '🔇';
  soundToggle.style.opacity = soundEnabled ? '1' : '0.6';
  if (soundEnabled) playMagicalSound('save');
});

function showToast(msg) {
  toastNotify.textContent = msg;
  toastNotify.classList.add('show');
  setTimeout(() => toastNotify.classList.remove('show'), 2600);
}

// ====================================================
// 2. FÍSICA 3D Y ARRASTRE DEL COLLAR
// ====================================================
let physics = {
  x: 0,
  y: - window.innerHeight * 0.9,
  vx: 0,
  vy: 18,
  rotX: 0,
  rotY: 0,
  rotZ: 13,
  isDragging: false,
  dragStartX: 0,
  dragStartY: 0,
  initialBookX: 0,
  initialBookY: 0,
  totalDragDist: 0,
  lastPointerX: 0,
  lastPointerY: 0,
  targetHoverX: 0,
  targetHoverY: 0,
  idleTime: 0
};

function getAnchors() {
  const w = window.innerWidth;
  return {
    left: { x: w * 0.28, y: -20 },
    right: { x: w * 0.72, y: -20 }
  };
}

function updateDynamicCord(ringX, ringY) {
  if (isBookOpen) {
    cordSvg.style.opacity = '0';
    return;
  }
  cordSvg.style.opacity = '1';

  const anchors = getAnchors();
  const deltaLeft = ringX - anchors.left.x;
  const cpLeftX = anchors.left.x + deltaLeft * 0.45;
  const cpLeftY = Math.max(anchors.left.y, ringY) * 0.58 + 45;

  const deltaRight = ringX - anchors.right.x;
  const cpRightX = anchors.right.x + deltaRight * 0.45;
  const cpRightY = Math.max(anchors.right.y, ringY) * 0.58 + 45;

  const dLeft = `M ${anchors.left.x} ${anchors.left.y} Q ${cpLeftX} ${cpLeftY}, ${ringX - 4} ${ringY - 1}`;
  const dRight = `M ${anchors.right.x} ${anchors.right.y} Q ${cpRightX} ${cpRightY}, ${ringX + 4} ${ringY - 1}`;

  svgCordLeftShadow.setAttribute('d', dLeft);
  svgCordLeftBase.setAttribute('d', dLeft);
  svgCordLeftTexture.setAttribute('d', dLeft);
  svgCordLeftShine.setAttribute('d', dLeft);

  svgCordRightShadow.setAttribute('d', dRight);
  svgCordRightBase.setAttribute('d', dRight);
  svgCordRightTexture.setAttribute('d', dRight);
  svgCordRightShine.setAttribute('d', dRight);

  svgRingGroup.setAttribute('transform', `translate(${ringX}, ${ringY})`);
}

function physicsLoop() {
  if (!isBookOpen) {
    physics.idleTime += 0.025;

    if (!physics.isDragging) {
      const idleSwayX = Math.sin(physics.idleTime * 1.8) * 8;
      const idleSwayY = Math.abs(Math.sin(physics.idleTime * 3.6)) * 4;

      const targetX = idleSwayX + physics.targetHoverX;
      const targetY = idleSwayY + physics.targetHoverY;

      const fx = (targetX - physics.x) * 0.045;
      const fy = (targetY - physics.y) * 0.045;

      physics.vx += fx;
      physics.vy += fy;

      physics.vx *= 0.92;
      physics.vy *= 0.92;

      physics.x += physics.vx;
      physics.y += physics.vy;
    }

    const targetRotY = (physics.x * 0.08) + (physics.vx * 0.35);
    const targetRotX = -(physics.y * 0.06) - (physics.vy * 0.25);
    const targetRotZ = 13 + (physics.x * 0.06) + (physics.vx * 0.15);

    physics.rotY += (targetRotY - physics.rotY) * 0.15;
    physics.rotX += (targetRotX - physics.rotX) * 0.15;
    physics.rotZ += (targetRotZ - physics.rotZ) * 0.15;

    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    const bookRealX = centerX + physics.x;
    const bookRealY = centerY + physics.y;

    bookWrapper.style.transform = `translate(calc(-50% + ${physics.x}px), calc(-50% + ${physics.y}px)) rotateX(${physics.rotX}deg) rotateY(${physics.rotY}deg) rotateZ(${physics.rotZ}deg)`;

    const glareX = 50 + (physics.rotY * 2.2);
    const glareY = 50 - (physics.rotX * 2.2);
    specularGlare.style.left = `${glareX}%`;
    specularGlare.style.top = `${glareY}%`;

    const ringScreenX = bookRealX;
    const ringScreenY = bookRealY - 175;

    updateDynamicCord(ringScreenX, ringScreenY);
  }

  requestAnimationFrame(physicsLoop);
}

function onPointerDown(e) {
  if (isBookOpen) return;
  initAudio();

  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  const clientY = e.touches ? e.touches[0].clientY : e.clientY;

  physics.isDragging = true;
  physics.dragStartX = clientX;
  physics.dragStartY = clientY;
  physics.initialBookX = physics.x;
  physics.initialBookY = physics.y;
  physics.lastPointerX = clientX;
  physics.lastPointerY = clientY;
  physics.totalDragDist = 0;

  bookWrapper.classList.add('dragging');
}

function onPointerMove(e) {
  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  const clientY = e.touches ? e.touches[0].clientY : e.clientY;

  if (physics.isDragging && !isBookOpen) {
    const dx = clientX - physics.dragStartX;
    const dy = clientY - physics.dragStartY;

    physics.x = physics.initialBookX + dx;
    physics.y = physics.initialBookY + dy;

    physics.vx = (clientX - physics.lastPointerX) * 0.6;
    physics.vy = (clientY - physics.lastPointerY) * 0.6;
    physics.lastPointerX = clientX;
    physics.lastPointerY = clientY;

    physics.totalDragDist += Math.hypot(dx, dy);
  } else if (!isBookOpen) {
    const normX = (clientX / window.innerWidth) - 0.5;
    const normY = (clientY / window.innerHeight) - 0.5;
    physics.targetHoverX = normX * 30;
    physics.targetHoverY = normY * 20;
  }
}

function onPointerUp() {
  if (!physics.isDragging || isBookOpen) return;
  physics.isDragging = false;
  bookWrapper.classList.remove('dragging');

  if (physics.totalDragDist < 12) {
    openBook();
  }
}

bookWrapper.addEventListener('mousedown', onPointerDown);
window.addEventListener('mousemove', onPointerMove);
window.addEventListener('mouseup', onPointerUp);

bookWrapper.addEventListener('touchstart', onPointerDown, { passive: true });
window.addEventListener('touchmove', onPointerMove, { passive: true });
window.addEventListener('touchend', onPointerUp);

// ====================================================
// 3. APERTURA Y CIERRE
// ====================================================
function openBook() {
  if (isBookOpen) return;
  isBookOpen = true;

  initAudio();
  playMagicalSound('open');

  bookWrapper.classList.add('opened');
  updateDateDisplay();

  if (hangNecklaceBtn) hangNecklaceBtn.classList.remove('hidden');
  if (openDirectBtn) openDirectBtn.classList.add('hidden');
  if (openTabsGroup) openTabsGroup.style.display = 'flex';
}

function closeBook() {
  if (!isBookOpen) return;
  isBookOpen = false;

  playMagicalSound('close');
  bookWrapper.classList.remove('opened');

  if (hangNecklaceBtn) hangNecklaceBtn.classList.add('hidden');
  if (openDirectBtn) openDirectBtn.classList.remove('hidden');
  if (openTabsGroup) openTabsGroup.style.display = 'none';

  physics.x = 0;
  physics.y = 0;
  physics.vx = 0;
  physics.vy = 6;
}

openDirectBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  openBook();
});

if (hangNecklaceBtn) {
  hangNecklaceBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    closeBook();
  });
}

// Pestañas (Reglas vs Registros)
tabRulesBtn.addEventListener('click', () => {
  tabRulesBtn.classList.add('active');
  tabMemosBtn.classList.remove('active');
  rulesView.classList.remove('hidden-view');
  memosView.classList.add('hidden-view');
  playMagicalSound('save');
});

tabMemosBtn.addEventListener('click', () => {
  tabMemosBtn.classList.add('active');
  tabRulesBtn.classList.remove('active');
  memosView.classList.remove('hidden-view');
  rulesView.classList.add('hidden-view');
  playMagicalSound('save');
});

// Filtros
filterAll.addEventListener('click', () => setFilter('all'));
filterPublic.addEventListener('click', () => setFilter('public'));
filterPrivate.addEventListener('click', () => setFilter('private'));

function setFilter(type) {
  currentFilter = type;
  [filterAll, filterPublic, filterPrivate].forEach(b => b.classList.remove('active'));
  if (type === 'all') filterAll.classList.add('active');
  if (type === 'public') filterPublic.classList.add('active');
  if (type === 'private') filterPrivate.classList.add('active');
  renderEntriesList();
}

// Switch Privacidad
privateToggle.addEventListener('change', () => {
  if (privateToggle.checked) {
    toggleLabel.textContent = '🔒 Privada';
    passwordFieldWrap.classList.remove('hidden');
    entryPasswordInput.focus();
  } else {
    toggleLabel.textContent = '🌐 Pública';
    passwordFieldWrap.classList.add('hidden');
    entryPasswordInput.value = '';
  }
});

// ====================================================
// 4. BASE DE DATOS DEL REPOSITORIO (data/entries.json)
// ====================================================

function hashPassword(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return 'dn_h_' + Math.abs(hash).toString(36);
}

// Cargar la base de datos: combina el archivo entries.json del repositorio con notas locales
async function loadDatabase() {
  let repoEntries = [];

  try {
    // Lee directamente el archivo data/entries.json del repositorio en GitHub
    const res = await fetch('data/entries.json?t=' + Date.now());
    if (res.ok) {
      repoEntries = await res.json();
    }
  } catch (err) {
    console.log('No se pudo cargar data/entries.json o modo offline', err);
  }

  let localEntries = [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    localEntries = raw ? JSON.parse(raw) : [];
  } catch (e) {
    localEntries = [];
  }

  // Unir notas del repositorio con las locales sin duplicados por ID
  const map = new Map();
  repoEntries.forEach(item => map.set(item.id, item));
  localEntries.forEach(item => map.set(item.id, item));

  entries = Array.from(map.values()).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  renderEntriesList();
}

function saveEntriesToStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

function updateDateDisplay() {
  const now = new Date();
  const options = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  autoDateSpan.textContent = now.toLocaleDateString('es-ES', options);
}

function clearEditor() {
  activeEntryId = null;
  entryIdInput.value = '';
  entryTitleInput.value = '';
  entryContentInput.value = '';
  entryPasswordInput.value = '';
  privateToggle.checked = false;
  toggleLabel.textContent = '🌐 Pública';
  passwordFieldWrap.classList.add('hidden');
  deleteBtn.classList.add('hidden');
  updateDateDisplay();
  renderEntriesList();
}

function handleEntryClick(id) {
  const entry = entries.find(item => item.id === id);
  if (!entry) return;

  if (entry.isPrivate) {
    pendingUnlockEntry = entry;
    unlockPassInput.value = '';
    unlockErrorMsg.classList.add('hidden');
    unlockModal.classList.add('active');
    setTimeout(() => unlockPassInput.focus(), 150);
  } else {
    displayEntryInEditor(entry);
  }
}

function verifyUnlockPassword() {
  if (!pendingUnlockEntry) return;

  const pass = unlockPassInput.value.trim();
  const enteredHash = hashPassword(pass);

  if (enteredHash === pendingUnlockEntry.passwordHash) {
    unlockModal.classList.remove('active');
    displayEntryInEditor(pendingUnlockEntry);
    playMagicalSound('save');
    showToast('🗝️ Registro desbloqueado.');
    pendingUnlockEntry = null;
  } else {
    unlockErrorMsg.classList.remove('hidden');
    unlockPassInput.classList.add('shake');
    setTimeout(() => unlockPassInput.classList.remove('shake'), 400);
  }
}

confirmUnlockBtn.addEventListener('click', verifyUnlockPassword);
unlockPassInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') verifyUnlockPassword();
});
cancelUnlockBtn.addEventListener('click', () => {
  unlockModal.classList.remove('active');
  pendingUnlockEntry = null;
});

function displayEntryInEditor(entry) {
  activeEntryId = entry.id;
  entryIdInput.value = entry.id;
  entryTitleInput.value = entry.title;
  entryContentInput.value = entry.content;
  autoDateSpan.textContent = entry.date;

  privateToggle.checked = !!entry.isPrivate;
  toggleLabel.textContent = entry.isPrivate ? '🔒 Privada' : '🌐 Pública';
  if (entry.isPrivate) {
    passwordFieldWrap.classList.remove('hidden');
    entryPasswordInput.value = '';
  } else {
    passwordFieldWrap.classList.add('hidden');
  }

  deleteBtn.classList.remove('hidden');

  playMagicalSound('save');
  renderEntriesList();
}

function renderEntriesList(searchQuery = null) {
  let filtered = entries;

  if (currentFilter === 'public') {
    filtered = filtered.filter(e => !e.isPrivate);
  } else if (currentFilter === 'private') {
    filtered = filtered.filter(e => e.isPrivate);
  }

  if (searchQuery) {
    const q = searchQuery.toLowerCase().trim();
    filtered = filtered.filter(e => 
      e.title.toLowerCase().includes(q) || 
      (!e.isPrivate && e.content.toLowerCase().includes(q))
    );
  }

  const countText = `${filtered.length} ${filtered.length === 1 ? 'entrada' : 'entradas'}`;
  entryCountEl.textContent = countText;
  tabCount.textContent = entries.length;

  if (filtered.length === 0) {
    entriesListEl.innerHTML = `
      <div style="text-align:center; color:#777785; margin-top:40px; font-style:italic; font-size:0.85rem;">
        <p>No hay registros que coincidan.</p>
        <p style="margin-top:4px;">Crea una nueva nota a la derecha.</p>
      </div>
    `;
    return;
  }

  entriesListEl.innerHTML = '';
  filtered.forEach(entry => {
    const card = document.createElement('div');
    card.className = `memo-card-dark ${entry.id === activeEntryId ? 'active' : ''} ${entry.isPrivate ? 'is-private' : ''}`;
    
    const previewText = entry.isPrivate 
      ? '🔒 [Registro protegido con contraseña privada]' 
      : escapeHTML(entry.content.substring(0, 42)) + (entry.content.length > 42 ? '...' : '');

    card.innerHTML = `
      <div class="card-top-line">
        <div class="memo-card-title-dark">${escapeHTML(entry.title || 'Sin título')}</div>
        ${entry.isPrivate ? '<span class="card-lock-badge" title="Protegida con contraseña">🔒</span>' : '<span class="card-lock-badge" title="Pública">🌐</span>'}
      </div>
      <div class="memo-card-date-dark">${escapeHTML(entry.date)}</div>
      <div class="memo-card-prev-dark">${previewText}</div>
    `;
    card.addEventListener('click', () => handleEntryClick(entry.id));
    entriesListEl.appendChild(card);
  });
}

function escapeHTML(str) {
  return str.replace(/[&<>'"]/g, 
    tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag)
  );
}

// Guardar / Actualizar nota
noteForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const title = entryTitleInput.value.trim();
  const content = entryContentInput.value.trim();
  if (!title || !content) return;

  const isPrivate = privateToggle.checked;
  const pass = entryPasswordInput.value.trim();

  if (isPrivate && !activeEntryId && !pass) {
    alert('Introduce una contraseña para sellar esta nota privada.');
    entryPasswordInput.focus();
    return;
  }

  const now = new Date();
  const dateFormatted = now.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  if (activeEntryId) {
    const index = entries.findIndex(item => item.id === activeEntryId);
    if (index !== -1) {
      entries[index].title = title;
      entries[index].content = content;
      entries[index].isPrivate = isPrivate;
      if (pass) {
        entries[index].passwordHash = hashPassword(pass);
      }
      entries[index].updatedAt = Date.now();
    }
  } else {
    const newEntry = {
      id: 'dn_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      title: title,
      content: content,
      isPrivate: isPrivate,
      passwordHash: isPrivate ? hashPassword(pass) : null,
      date: dateFormatted,
      createdAt: Date.now()
    };
    entries.unshift(newEntry);
    activeEntryId = newEntry.id;
  }

  playMagicalSound('save');
  saveEntriesToStorage();
  renderEntriesList();
  
  if (activeEntryId) {
    const cur = entries.find(e => e.id === activeEntryId);
    if (cur) displayEntryInEditor(cur);
  }

  showToast(isPrivate ? '🔒 ¡Nota sellada con contraseña!' : '🌐 ¡Registro grabado con éxito!');

  const saveBtn = document.getElementById('save-btn');
  const originalHtml = saveBtn.innerHTML;
  saveBtn.innerHTML = '<span>✔ ¡Grabado en la Death Note!</span>';
  saveBtn.style.background = '#27ae60';
  setTimeout(() => {
    saveBtn.innerHTML = originalHtml;
    saveBtn.style.background = '';
  }, 1300);
});

// Botón Nuevo
newEntryBtn.addEventListener('click', (e) => {
  e.preventDefault();
  clearEditor();
  entryTitleInput.focus();
  playMagicalSound('save');
});

// Eliminar
deleteBtn.addEventListener('click', () => {
  if (!activeEntryId) return;

  const confirmDelete = confirm('¿Deseas tachar y borrar definitivamente este registro?');
  if (confirmDelete) {
    playMagicalSound('delete');
    entries = entries.filter(item => item.id !== activeEntryId);
    saveEntriesToStorage();
    clearEditor();
    showToast('🗑️ Registro borrado.');
  }
});

// Búsqueda
searchInput.addEventListener('input', (e) => {
  renderEntriesList(e.target.value);
});

// Exportar TXT y JSON de Base de Datos
exportBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  if (entries.length === 0) {
    alert('Aún no tienes notas escritas para exportar.');
    return;
  }

  playMagicalSound('save');

  // Descargar archivo entries.json listo para el repositorio
  const jsonBlob = new Blob([JSON.stringify(entries, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(jsonBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `entries.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('💾 Base de datos (entries.json) descargada.');
});

// ====================================================
// 5. AMBIENTE VISUAL
// ====================================================
let sparkles = [];
let ambientCtx = null;

function setupAmbientCanvas() {
  ambientCtx = ambientCanvas.getContext('2d');
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  sparkles = [];
  const count = window.innerWidth < 768 ? 20 : 45;
  for (let i = 0; i < count; i++) {
    sparkles.push({
      x: Math.random() * ambientCanvas.width,
      y: Math.random() * ambientCanvas.height,
      radius: Math.random() * 1.5 + 0.4,
      alpha: Math.random() * 0.5 + 0.1,
      speed: Math.random() * 0.02 + 0.005,
      angle: Math.random() * Math.PI * 2,
      color: 'rgba(235, 235, 245,'
    });
  }

  animateAmbient();
}

function resizeCanvas() {
  ambientCanvas.width = window.innerWidth;
  ambientCanvas.height = window.innerHeight;
}

function animateAmbient() {
  ambientCtx.clearRect(0, 0, ambientCanvas.width, ambientCanvas.height);

  for (let s of sparkles) {
    s.angle += s.speed;
    const currentAlpha = Math.abs(Math.sin(s.angle)) * s.alpha;

    ambientCtx.beginPath();
    ambientCtx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
    ambientCtx.fillStyle = `${s.color} ${currentAlpha})`;
    ambientCtx.fill();
  }

  requestAnimationFrame(animateAmbient);
}

// ====================================================
// INICIALIZACIÓN
// ====================================================
window.addEventListener('DOMContentLoaded', () => {
  setupAmbientCanvas();
  loadDatabase();
  updateDateDisplay();
  physicsLoop();

  setTimeout(() => {
    playMagicalSound('drop');
  }, 700);
});
