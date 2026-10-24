/* ====================================================
   DEATH NOTE • DIARIO SECRETO (JAVASCRIPT)
   Sonidos Melódicos de Caja Musical y Animación 3D
   ==================================================== */

// --- Estado Global ---
const STORAGE_KEY = 'death_note_secret_diary_v2';
let entries = [];
let activeEntryId = null;
let soundEnabled = true;

// --- Elementos DOM ---
const necklaceRig = document.getElementById('necklace-rig') || document.getElementById('pendant-rig');
const necklaceCordWrap = document.getElementById('necklace-cord-wrap');
const book3D = document.getElementById('book-3d');
const closeBookBtn = document.getElementById('close-book-btn');
const hintContainer = document.getElementById('hint-container');
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

// Canvas
const ambientCanvas = document.getElementById('ambient-canvas');

// ====================================================
// 1. SISTEMA DE AUDIO MELÓDICO (ESTILO CAJA MUSICAL / ANIME)
// Diseñado para ser dulce, elegante y agradable
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

// Generador de notas de campana / caja musical con armónicos suaves
function playBellNote(freq, startTime, duration = 1.2, volume = 0.22) {
  if (!audioCtx) return;

  // Oscilador fundamental (tono puro y dulce)
  const osc1 = audioCtx.createOscillator();
  const gain1 = audioCtx.createGain();
  osc1.type = 'sine';
  osc1.frequency.setValueAtTime(freq, startTime);

  // Armónico suave para dar brillo de campana mágica
  const osc2 = audioCtx.createOscillator();
  const gain2 = audioCtx.createGain();
  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(freq * 2.01, startTime);

  // Envolvente de sonido de campana (ataque rápido, decaimiento suave)
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

// Susurro suave de página de papel
function playPaperRustle(startTime, duration = 0.35) {
  if (!audioCtx) return;
  const bufferSize = audioCtx.sampleRate * duration;
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * 0.15;
  }

  const noise = audioCtx.createBufferSource();
  noise.buffer = buffer;

  const filter = audioCtx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(900, startTime);
  filter.frequency.linearRampToValueAtTime(400, startTime + duration);

  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(0.001, startTime);
  gain.gain.linearRampToValueAtTime(0.08, startTime + 0.05);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(audioCtx.destination);

  noise.start(startTime);
}

// Orquestador de sonidos estéticos
function playMagicalSound(type) {
  if (!soundEnabled) return;
  initAudio();
  if (!audioCtx) return;

  const now = audioCtx.currentTime;

  if (type === 'drop') {
    // Campanitas celestiales suaves cuando el libro aterriza
    playBellNote(659.25, now, 1.2, 0.15);       // E5
    playBellNote(987.77, now + 0.15, 1.4, 0.12); // B5

  } else if (type === 'open') {
    // Melodía ascendente de caja musical mágica al abrirse
    playPaperRustle(now, 0.5);
    playBellNote(554.37, now + 0.05, 1.3, 0.2); // C#5
    playBellNote(659.25, now + 0.18, 1.3, 0.22); // E5
    playBellNote(830.61, now + 0.32, 1.4, 0.25); // G#5
    playBellNote(1108.73, now + 0.46, 1.6, 0.28); // C#6

  } else if (type === 'close') {
    // Melodía descendente suave al cerrar
    playPaperRustle(now, 0.4);
    playBellNote(830.61, now + 0.05, 1.0, 0.18); // G#5
    playBellNote(659.25, now + 0.18, 1.2, 0.18); // E5
    playBellNote(554.37, now + 0.32, 1.4, 0.16); // C#5

  } else if (type === 'save') {
    // Destello de campanas alegres al guardar
    playBellNote(987.77, now, 1.0, 0.2);        // B5
    playBellNote(1318.51, now + 0.12, 1.3, 0.24); // E6
    playBellNote(1661.22, now + 0.24, 1.5, 0.25); // G#6

  } else if (type === 'delete') {
    // Tono suave de despedida
    playBellNote(440.0, now, 0.9, 0.15); // A4
    playBellNote(392.0, now + 0.15, 1.1, 0.12); // G4
  }
}

// Botón de sonido
soundToggle.addEventListener('click', (e) => {
  e.stopPropagation();
  initAudio();
  soundEnabled = !soundEnabled;
  soundIcon.textContent = soundEnabled ? '✨' : '🔇';
  soundToggle.style.opacity = soundEnabled ? '1' : '0.6';
  if (soundEnabled) {
    playMagicalSound('save');
  }
});

// ====================================================
// 2. ANIMACIÓN DE ENTRADA (CAÍDA DESDE ARRIBA)
// ====================================================
function triggerDropAnimation() {
  necklaceRig.classList.add('dropping');
  
  // Al tocar el fondo, sonar campanita suave
  setTimeout(() => {
    playMagicalSound('drop');
  }, 620);
}

// ====================================================
// 3. APERTURA Y CIERRE DEL LIBRO 3D
// ====================================================
function openBook() {
  if (necklaceRig.classList.contains('opened')) return;

  initAudio();
  playMagicalSound('open');
  necklaceRig.classList.remove('dropping');
  necklaceRig.classList.add('opened');
  updateDateDisplay();
}

function closeBook() {
  if (!necklaceRig.classList.contains('opened')) return;

  playMagicalSound('close');
  necklaceRig.classList.remove('opened');
}

// Al hacer clic en la libreta, cordón o texto cuando está cerrado -> se abre
book3D.addEventListener('click', (e) => {
  if (!necklaceRig.classList.contains('opened')) {
    openBook();
  }
});

if (necklaceCordWrap) {
  necklaceCordWrap.addEventListener('click', () => {
    if (!necklaceRig.classList.contains('opened')) openBook();
  });
}

if (hintContainer) {
  hintContainer.addEventListener('click', () => {
    if (!necklaceRig.classList.contains('opened')) openBook();
  });
}

closeBookBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  closeBook();
});

// ====================================================
// 4. ATMÓSFERA VISUAL (Estrellas y destellos suaves)
// ====================================================
let sparkles = [];
let ambientCtx = null;

function setupAmbientCanvas() {
  ambientCtx = ambientCanvas.getContext('2d');
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  sparkles = [];
  const count = window.innerWidth < 768 ? 30 : 60;
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
// 5. MODAL DE REGLAS (HOW TO USE IT)
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
// 6. GESTIÓN DEL DIARIO (CRUD & LOCALSTORAGE)
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
  editorHeading.textContent = 'Nuevo Recuerdo';
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
      <div class="empty-memo">
        <p>Aún no hay memorias escritas.</p>
        <p style="font-size:0.8rem; margin-top:4px; opacity:0.8;">Escribe tu primer secreto o pensamiento a la derecha.</p>
      </div>
    `;
    return;
  }

  entriesListEl.innerHTML = '';
  items.forEach(entry => {
    const card = document.createElement('div');
    card.className = `entry-item-card ${entry.id === activeEntryId ? 'active' : ''}`;
    card.innerHTML = `
      <div class="card-title">${escapeHTML(entry.title || 'Sin título')}</div>
      <div class="card-date">${escapeHTML(entry.date)}</div>
      <div class="card-snippet">${escapeHTML(entry.content.substring(0, 48))}${entry.content.length > 48 ? '...' : ''}</div>
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

// Guardar o Actualizar nota
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
  saveBtn.innerHTML = '<span>✨ ¡Guardado con Éxito!</span>';
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

// Eliminar Nota
deleteBtn.addEventListener('click', () => {
  if (!activeEntryId) return;

  const confirmDelete = confirm('¿Deseas tachar y borrar esta memoria del diario?');
  if (confirmDelete) {
    playMagicalSound('delete');
    entries = entries.filter(item => item.id !== activeEntryId);
    saveEntriesToStorage();
    clearEditor();
  }
});

// Búsqueda en vivo
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

// Exportar notas a archivo .txt
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
  a.download = `diario-secreto-${new Date().toISOString().slice(0, 10)}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
});

// ====================================================
// INICIALIZACIÓN
// ====================================================
window.addEventListener('DOMContentLoaded', () => {
  setupAmbientCanvas();
  loadEntries();
  updateDateDisplay();
  triggerDropAnimation();
});
