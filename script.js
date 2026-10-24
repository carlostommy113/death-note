/* ====================================================
   DEATH NOTE • DIARIO SECRETO 3D REAL (JAVASCRIPT)
   Motor de Física 3D Interactivo, Cordón SVG Dinámico
   ==================================================== */

// --- Estado Global ---
const STORAGE_KEY = 'death_note_secret_diary_v3';
let entries = [];
let activeEntryId = null;
let soundEnabled = true;
let isBookOpen = false;

// --- Elementos DOM ---
const interactiveStage = document.getElementById('interactive-stage');
const bookWrapper = document.getElementById('book-3d-wrapper');
const bookCube = document.getElementById('book-cube-3d');
const lightGlare = document.getElementById('light-glare');
const openDirectBtn = document.getElementById('open-direct-btn');
const closeBookBtn = document.getElementById('close-book-btn');
const rulesBtn = document.getElementById('rules-btn');
const closeRulesBtn = document.getElementById('close-rules-btn');
const closeRulesBtn2 = document.getElementById('close-rules-btn-2');
const rulesModal = document.getElementById('rules-modal');
const exportBtn = document.getElementById('export-btn');
const soundToggle = document.getElementById('sound-toggle');
const soundIcon = document.getElementById('sound-icon');

// Formulario y Notas
const noteForm = document.getElementById('note-form');
const entryIdInput = document.getElementById('entry-id');
const entryTitleInput = document.getElementById('entry-title');
const entryContentInput = document.getElementById('entry-content');
const autoDateSpan = document.getElementById('auto-date');
const editorHeading = document.getElementById('editor-heading');
const entriesListEl = document.getElementById('entries-list');
const entryCountEl = document.getElementById('entry-count');
const newEntryBtn = document.getElementById('new-entry-btn');
const deleteBtn = document.getElementById('delete-btn');
const searchInput = document.getElementById('search-input');

// Elementos SVG Dinámicos
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
// 1. SISTEMA DE AUDIO (Campanas de Caja Musical y Papel)
// ====================================================
let audioCtx = null;

function initAudio() {
  if (!audioCtx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
      audioCtx = new AudioContext();
    }
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

function playPaperRustle(startTime, duration = 0.4) {
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
    playBellNote(659.25, now, 1.2, 0.16);       // E5
    playBellNote(987.77, now + 0.12, 1.4, 0.13); // B5
  } else if (type === 'open') {
    playPaperRustle(now, 0.5);
    playBellNote(554.37, now + 0.04, 1.3, 0.2); // C#5
    playBellNote(659.25, now + 0.16, 1.3, 0.22); // E5
    playBellNote(830.61, now + 0.28, 1.4, 0.25); // G#5
    playBellNote(1108.73, now + 0.42, 1.6, 0.28); // C#6
  } else if (type === 'close') {
    playPaperRustle(now, 0.35);
    playBellNote(830.61, now + 0.04, 1.0, 0.18); // G#5
    playBellNote(659.25, now + 0.16, 1.2, 0.18); // E5
    playBellNote(554.37, now + 0.28, 1.4, 0.16); // C#5
  } else if (type === 'save') {
    playBellNote(987.77, now, 1.0, 0.2);        // B5
    playBellNote(1318.51, now + 0.12, 1.3, 0.24); // E6
    playBellNote(1661.22, now + 0.24, 1.5, 0.25); // G#6
  } else if (type === 'delete') {
    playBellNote(440.0, now, 0.8, 0.15); // A4
    playBellNote(392.0, now + 0.14, 1.0, 0.12); // G4
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

// ====================================================
// 2. MOTOR DE FÍSICA 3D Y ARRASTRE DEL COLLAR
// ====================================================
let physics = {
  x: 0,
  y: - window.innerHeight * 0.9, // Empieza arriba para caer
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

// Puntos de anclaje fijos del collar arriba en la pantalla
function getAnchors() {
  const w = window.innerWidth;
  return {
    left: { x: w * 0.28, y: -20 },
    right: { x: w * 0.72, y: -20 }
  };
}

// Actualizar el cordón SVG dinámico
function updateDynamicCord(ringX, ringY) {
  if (isBookOpen) {
    cordSvg.style.opacity = '0';
    return;
  }
  cordSvg.style.opacity = '1';

  const anchors = getAnchors();

  // Curvatura catenaria calculada dinámicamente según la posición del libro
  const deltaLeft = ringX - anchors.left.x;
  const cpLeftX = anchors.left.x + deltaLeft * 0.45;
  const cpLeftY = Math.max(anchors.left.y, ringY) * 0.58 + 45;

  const deltaRight = ringX - anchors.right.x;
  const cpRightX = anchors.right.x + deltaRight * 0.45;
  const cpRightY = Math.max(anchors.right.y, ringY) * 0.58 + 45;

  const dLeft = `M ${anchors.left.x} ${anchors.left.y} Q ${cpLeftX} ${cpLeftY}, ${ringX - 4} ${ringY - 1}`;
  const dRight = `M ${anchors.right.x} ${anchors.right.y} Q ${cpRightX} ${cpRightY}, ${ringX + 4} ${ringY - 1}`;

  // Aplicar a las capas de trazado
  svgCordLeftShadow.setAttribute('d', dLeft);
  svgCordLeftBase.setAttribute('d', dLeft);
  svgCordLeftTexture.setAttribute('d', dLeft);
  svgCordLeftShine.setAttribute('d', dLeft);

  svgCordRightShadow.setAttribute('d', dRight);
  svgCordRightBase.setAttribute('d', dRight);
  svgCordRightTexture.setAttribute('d', dRight);
  svgCordRightShine.setAttribute('d', dRight);

  // Mover la argolla metálica donde se unen los cordones
  svgRingGroup.setAttribute('transform', `translate(${ringX}, ${ringY})`);
}

// Bucle de Física 60 FPS
function physicsLoop() {
  if (!isBookOpen) {
    physics.idleTime += 0.025;

    if (!physics.isDragging) {
      // Movimiento pendular sutil en reposo
      const idleSwayX = Math.sin(physics.idleTime * 1.8) * 8;
      const idleSwayY = Math.abs(Math.sin(physics.idleTime * 3.6)) * 4;

      const targetX = idleSwayX + physics.targetHoverX;
      const targetY = idleSwayY + physics.targetHoverY;

      // Fuerza de resorte hacia el centro (Spring Physics)
      const fx = (targetX - physics.x) * 0.045;
      const fy = (targetY - physics.y) * 0.045;

      physics.vx += fx;
      physics.vy += fy;

      // Amortiguación (damping)
      physics.vx *= 0.92;
      physics.vy *= 0.92;

      physics.x += physics.vx;
      physics.y += physics.vy;
    }

    // Calcular ángulos de rotación 3D en base al arrastre, velocidad y posición
    const targetRotY = (physics.x * 0.08) + (physics.vx * 0.35);
    const targetRotX = -(physics.y * 0.06) - (physics.vy * 0.25);
    const targetRotZ = 13 + (physics.x * 0.06) + (physics.vx * 0.15); // Inclinación natural de 13°

    physics.rotY += (targetRotY - physics.rotY) * 0.15;
    physics.rotX += (targetRotX - physics.rotX) * 0.15;
    physics.rotZ += (targetRotZ - physics.rotZ) * 0.15;

    // Aplicar transformación 3D completa al libro
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    const bookRealX = centerX + physics.x;
    const bookRealY = centerY + physics.y;

    bookWrapper.style.transform = `translate(calc(-50% + ${physics.x}px), calc(-50% + ${physics.y}px)) rotateX(${physics.rotX}deg) rotateY(${physics.rotY}deg) rotateZ(${physics.rotZ}deg)`;

    // Mover reflejo de luz en la cubierta según la inclinación 3D
    const glareX = 50 + (physics.rotY * 2.2);
    const glareY = 50 - (physics.rotX * 2.2);
    lightGlare.style.left = `${glareX}%`;
    lightGlare.style.top = `${glareY}%`;

    // Calcular punto exacto de la argolla del libro en coordenadas de pantalla
    const ringScreenX = bookRealX;
    const ringScreenY = bookRealY - 170; // 340px / 2 = 170px hasta el borde superior

    updateDynamicCord(ringScreenX, ringScreenY);
  }

  requestAnimationFrame(physicsLoop);
}

// Interacción de Arrastre (Mouse y Touch)
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

    // Calcular velocidad de lanzamiento
    physics.vx = (clientX - physics.lastPointerX) * 0.6;
    physics.vy = (clientY - physics.lastPointerY) * 0.6;
    physics.lastPointerX = clientX;
    physics.lastPointerY = clientY;

    physics.totalDragDist += Math.hypot(dx, dy);
  } else if (!isBookOpen) {
    // Parallax suave al mover el ratón sin arrastrar
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

  // Si casi no se movió (< 12px), se considera un toque/clic para abrir la libreta
  if (physics.totalDragDist < 12) {
    openBook();
  }
}

// Event Listeners para Mouse y Touch
bookWrapper.addEventListener('mousedown', onPointerDown);
window.addEventListener('mousemove', onPointerMove);
window.addEventListener('mouseup', onPointerUp);

bookWrapper.addEventListener('touchstart', onPointerDown, { passive: true });
window.addEventListener('touchmove', onPointerMove, { passive: true });
window.addEventListener('touchend', onPointerUp);

// ====================================================
// 3. APERTURA Y CIERRE DEL LIBRO EN 3D
// ====================================================
function openBook() {
  if (isBookOpen) return;
  isBookOpen = true;

  initAudio();
  playMagicalSound('open');

  bookWrapper.classList.add('opened');
  updateDateDisplay();
}

function closeBook() {
  if (!isBookOpen) return;
  isBookOpen = false;

  playMagicalSound('close');
  bookWrapper.classList.remove('opened');

  // Reactivar física en el centro
  physics.x = 0;
  physics.y = 0;
  physics.vx = 0;
  physics.vy = 6;
}

openDirectBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  openBook();
});

closeBookBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  closeBook();
});

// ====================================================
// 4. MODAL DE REGLAS
// ====================================================
rulesBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  rulesModal.classList.add('active');
  playMagicalSound('save');
});

closeRulesBtn.addEventListener('click', () => rulesModal.classList.remove('active'));
closeRulesBtn2.addEventListener('click', () => rulesModal.classList.remove('active'));
rulesModal.addEventListener('click', (e) => {
  if (e.target === rulesModal) {
    rulesModal.classList.remove('active');
  }
});

// ====================================================
// 5. GESTIÓN DEL DIARIO (LOCALSTORAGE Y CRUD)
// ====================================================
function loadEntries() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    entries = raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Error cargando notas', e);
    entries = [];
  }
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
  editorHeading.textContent = 'Nuevo Pensamiento';
  deleteBtn.classList.add('hidden');
  updateDateDisplay();
  renderEntriesList();
}

function selectEntry(id) {
  const entry = entries.find(item => item.id === id);
  if (!entry) return;

  activeEntryId = id;
  entryIdInput.value = entry.id;
  entryTitleInput.value = entry.title;
  entryContentInput.value = entry.content;
  autoDateSpan.textContent = entry.date;
  editorHeading.textContent = 'Editar Memoria';
  deleteBtn.classList.remove('hidden');

  playMagicalSound('save');
  renderEntriesList();
}

function renderEntriesList(filtered = null) {
  const items = filtered !== null ? filtered : entries;
  entryCountEl.textContent = `${items.length} ${items.length === 1 ? 'nota' : 'notas'}`;

  if (items.length === 0) {
    entriesListEl.innerHTML = `
      <div class="empty-state-notice">
        <p>Aún no hay memorias escritas.</p>
        <p style="font-size:0.8rem; margin-top:4px; opacity:0.8;">Escribe tu primer secreto o pensamiento a la derecha.</p>
      </div>
    `;
    return;
  }

  entriesListEl.innerHTML = '';
  items.forEach(entry => {
    const card = document.createElement('div');
    card.className = `memo-card ${entry.id === activeEntryId ? 'active' : ''}`;
    card.innerHTML = `
      <div class="memo-card-title">${escapeHTML(entry.title || 'Sin título')}</div>
      <div class="memo-card-date">${escapeHTML(entry.date)}</div>
      <div class="memo-card-preview">${escapeHTML(entry.content.substring(0, 48))}${entry.content.length > 48 ? '...' : ''}</div>
    `;
    card.addEventListener('click', () => selectEntry(entry.id));
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
      entries[index].updatedAt = Date.now();
    }
  } else {
    const newEntry = {
      id: 'entry_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      title: title,
      content: content,
      date: dateFormatted,
      createdAt: Date.now()
    };
    entries.unshift(newEntry);
    activeEntryId = newEntry.id;
  }

  playMagicalSound('save');
  saveEntriesToStorage();
  renderEntriesList();
  selectEntry(activeEntryId);

  // Animación del botón
  const saveBtn = document.getElementById('save-btn');
  const originalHtml = saveBtn.innerHTML;
  saveBtn.innerHTML = '<span>✨ ¡Grabado en la Death Note!</span>';
  saveBtn.style.background = '#27ae60';
  setTimeout(() => {
    saveBtn.innerHTML = originalHtml;
    saveBtn.style.background = '';
  }, 1300);
});

// Botón Nueva
newEntryBtn.addEventListener('click', (e) => {
  e.preventDefault();
  clearEditor();
  entryTitleInput.focus();
  playMagicalSound('save');
});

// Eliminar
deleteBtn.addEventListener('click', () => {
  if (!activeEntryId) return;

  const confirmDelete = confirm('¿Deseas tachar y borrar permanentemente esta memoria?');
  if (confirmDelete) {
    playMagicalSound('delete');
    entries = entries.filter(item => item.id !== activeEntryId);
    saveEntriesToStorage();
    clearEditor();
  }
});

// Búsqueda
searchInput.addEventListener('input', (e) => {
  const query = e.target.value.toLowerCase().trim();
  if (!query) {
    renderEntriesList();
    return;
  }
  const filtered = entries.filter(item => 
    item.title.toLowerCase().includes(query) || 
    item.content.toLowerCase().includes(query)
  );
  renderEntriesList(filtered);
});

// Exportar
exportBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  if (entries.length === 0) {
    alert('Aún no tienes notas escritas para exportar.');
    return;
  }

  playMagicalSound('save');

  let textContent = `=====================================\n     DEATH NOTE • DIARIO SECRETO     \n=====================================\n\n`;
  entries.forEach((entry, idx) => {
    textContent += `[MEMORIA #${idx + 1}]\n`;
    textContent += `FECHA: ${entry.date}\n`;
    textContent += `TÍTULO: ${entry.title}\n`;
    textContent += `-------------------------------------\n`;
    textContent += `${entry.content}\n\n`;
    textContent += `=====================================\n\n`;
  });

  const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `death-note-diario-${new Date().toISOString().slice(0, 10)}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
});

// ====================================================
// 6. AMBIENTE VISUAL (Partículas y Destellos)
// ====================================================
let sparkles = [];
let ambientCtx = null;

function setupAmbientCanvas() {
  ambientCtx = ambientCanvas.getContext('2d');
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  sparkles = [];
  const count = window.innerWidth < 768 ? 25 : 55;
  for (let i = 0; i < count; i++) {
    sparkles.push({
      x: Math.random() * ambientCanvas.width,
      y: Math.random() * ambientCanvas.height,
      radius: Math.random() * 1.8 + 0.4,
      alpha: Math.random() * 0.7 + 0.2,
      speed: Math.random() * 0.02 + 0.005,
      angle: Math.random() * Math.PI * 2,
      color: Math.random() > 0.4 ? 'rgba(235, 235, 245,' : 'rgba(215, 75, 100,'
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
  loadEntries();
  updateDateDisplay();
  physicsLoop();

  // Sonido suave de campanita al aterrizar
  setTimeout(() => {
    playMagicalSound('drop');
  }, 700);
});
