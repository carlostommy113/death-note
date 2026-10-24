/* ====================================================
   DEATH NOTE - DIARIO INTERACTIVO (JAVASCRIPT)
   ==================================================== */

// --- Estado de la Aplicación ---
const STORAGE_KEY = 'death_note_diary_entries_v1';
let entries = [];
let activeEntryId = null;
let soundEnabled = true;

// --- Elementos DOM ---
const necklaceScreen = document.getElementById('necklace-screen');
const bookScreen = document.getElementById('book-screen');
const necklaceTrigger = document.getElementById('necklace-trigger');
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

// Canvas ambiental
const ambientCanvas = document.getElementById('ambient-canvas');

// ====================================================
// 1. SISTEMA DE AUDIO (Web Audio API - Cero dependencias externas)
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

function playDeathSound(type) {
  if (!soundEnabled) return;
  initAudio();
  if (!audioCtx) return;

  const now = audioCtx.currentTime;

  if (type === 'open') {
    // Sonido cinemático profundo y misterioso
    const osc1 = audioCtx.createOscillator();
    const osc2 = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(110, now);
    osc1.frequency.exponentialRampToValueAtTime(55, now + 1.2);

    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(164.8, now); // Nota E3
    osc2.frequency.exponentialRampToValueAtTime(82.4, now + 1.2);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.linearRampToValueAtTime(0.001, now + 1.4);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(audioCtx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 1.4);
    osc2.stop(now + 1.4);

  } else if (type === 'write') {
    // Sonido sutil de pluma y página
    const noiseBuffer = audioCtx.createBuffer(1, audioCtx.sampleRate * 0.15, audioCtx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < noiseBuffer.length; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    const whiteNoise = audioCtx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;

    const filter = audioCtx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1400;

    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

    whiteNoise.connect(filter);
    filter.connect(gain);
    gain.connect(audioCtx.destination);

    whiteNoise.start(now);

  } else if (type === 'delete') {
    // Tono grave de eliminación
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(130, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.35);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start(now);
    osc.stop(now + 0.35);
  }
}

soundToggle.addEventListener('click', (e) => {
  e.stopPropagation();
  soundEnabled = !soundEnabled;
  soundIcon.textContent = soundEnabled ? '🔊' : '🔇';
});

// ====================================================
// 2. AMBIENTE VISUAL (Partículas y cenizas flotantes)
// ====================================================
let particles = [];
let ambientCtx = null;

function setupAmbientCanvas() {
  ambientCtx = ambientCanvas.getContext('2d');
  resizeAmbientCanvas();
  window.addEventListener('resize', resizeAmbientCanvas);

  particles = [];
  const count = window.innerWidth < 768 ? 25 : 45;
  for (let i = 0; i < count; i++) {
    particles.push({
      x: Math.random() * ambientCanvas.width,
      y: Math.random() * ambientCanvas.height,
      radius: Math.random() * 2 + 0.6,
      vx: (Math.random() - 0.5) * 0.4,
      vy: -(Math.random() * 0.6 + 0.3),
      alpha: Math.random() * 0.6 + 0.2,
      color: Math.random() > 0.4 ? 'rgba(201, 24, 43,' : 'rgba(220, 220, 220,'
    });
  }

  animateAmbient();
}

function resizeAmbientCanvas() {
  ambientCanvas.width = window.innerWidth;
  ambientCanvas.height = window.innerHeight;
}

function animateAmbient() {
  ambientCtx.clearRect(0, 0, ambientCanvas.width, ambientCanvas.height);

  for (let p of particles) {
    p.x += p.vx;
    p.y += p.vy;

    if (p.y < -10) {
      p.y = ambientCanvas.height + 10;
      p.x = Math.random() * ambientCanvas.width;
    }
    if (p.x < -10) p.x = ambientCanvas.width + 10;
    if (p.x > ambientCanvas.width + 10) p.x = -10;

    ambientCtx.beginPath();
    ambientCtx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ambientCtx.fillStyle = `${p.color} ${p.alpha})`;
    ambientCtx.fill();
  }

  requestAnimationFrame(animateAmbient);
}

// ====================================================
// 4. TRANSICIÓN: DEL COLLAR A LA LIBRETA
// ====================================================
function openDeathNote() {
  initAudio();
  playDeathSound('open');

  necklaceScreen.classList.add('opening');

  setTimeout(() => {
    necklaceScreen.classList.remove('active', 'opening');
    bookScreen.classList.add('active');
    updateDateDisplay();
  }, 750);
}

function closeDeathNote() {
  playDeathSound('open');
  bookScreen.classList.remove('active');
  necklaceScreen.classList.add('active');
}

necklaceScreen.addEventListener('click', openDeathNote);
closeBookBtn.addEventListener('click', closeDeathNote);

// Modales de Reglas
rulesBtn.addEventListener('click', () => {
  rulesModal.classList.add('active');
});
closeRulesBtn.addEventListener('click', () => {
  rulesModal.classList.remove('active');
});
closeRulesBtn2.addEventListener('click', () => {
  rulesModal.classList.remove('active');
});
rulesModal.addEventListener('click', (e) => {
  if (e.target === rulesModal) {
    rulesModal.classList.remove('active');
  }
});

// ====================================================
// 5. GESTIÓN DEL DIARIO (LOCAL STORAGE Y CRUD)
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
  editorHeading.textContent = 'Nueva Entrada';
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
  editorHeading.textContent = 'Editar Entrada';
  deleteBtn.classList.remove('hidden');

  renderEntriesList();
}

function renderEntriesList(filtered = null) {
  const items = filtered !== null ? filtered : entries;
  entryCountEl.textContent = `${items.length} ${items.length === 1 ? 'nota' : 'notas'}`;

  if (items.length === 0) {
    entriesListEl.innerHTML = `
      <div class="empty-state">
        <p>No hay registros que coincidan.</p>
        <p class="sub">Escribe tu primer pensamiento o memoria a la derecha.</p>
      </div>
    `;
    return;
  }

  entriesListEl.innerHTML = '';
  items.forEach(entry => {
    const card = document.createElement('div');
    card.className = `entry-card ${entry.id === activeEntryId ? 'active' : ''}`;
    card.innerHTML = `
      <div class="entry-card-title">${escapeHTML(entry.title || 'Sin título')}</div>
      <div class="entry-card-meta">
        <span>${escapeHTML(entry.date)}</span>
      </div>
      <div class="entry-card-preview">${escapeHTML(entry.content.substring(0, 50))}${entry.content.length > 50 ? '...' : ''}</div>
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
    // Editar existente
    const index = entries.findIndex(item => item.id === activeEntryId);
    if (index !== -1) {
      entries[index].title = title;
      entries[index].content = content;
      entries[index].updatedAt = Date.now();
    }
  } else {
    // Crear nueva nota
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

  playDeathSound('write');
  saveEntriesToStorage();
  renderEntriesList();
  selectEntry(activeEntryId);

  // Animación breve de guardado
  const saveBtn = document.getElementById('save-btn');
  const originalHtml = saveBtn.innerHTML;
  saveBtn.innerHTML = '<span>✔ ¡Grabado en la Death Note!</span>';
  saveBtn.style.background = '#27ae60';
  setTimeout(() => {
    saveBtn.innerHTML = originalHtml;
    saveBtn.style.background = '';
  }, 1200);
});

// Botón "Nueva Entrada"
newEntryBtn.addEventListener('click', () => {
  clearEditor();
  entryTitleInput.focus();
});

// Eliminar Nota
deleteBtn.addEventListener('click', () => {
  if (!activeEntryId) return;

  const confirmDelete = confirm('¿Estás seguro de que deseas tachar y borrar permanentemente este registro de la Death Note?');
  if (confirmDelete) {
    playDeathSound('delete');
    entries = entries.filter(item => item.id !== activeEntryId);
    saveEntriesToStorage();
    clearEditor();
  }
});

// Búsqueda en tiempo real
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

// Exportar notas a archivo de texto
exportBtn.addEventListener('click', () => {
  if (entries.length === 0) {
    alert('Aún no tienes notas escritas para exportar.');
    return;
  }

  let textContent = `=====================================\n        DEATH NOTE - DIARIO          \n=====================================\n\n`;
  entries.forEach((e, idx) => {
    textContent += `[REGISTRO #${idx + 1}]\n`;
    textContent += `FECHA: ${e.date}\n`;
    textContent += `TÍTULO: ${e.title}\n`;
    textContent += `-------------------------------------\n`;
    textContent += `${e.content}\n\n`;
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
// INICIALIZACIÓN
// ====================================================
window.addEventListener('DOMContentLoaded', () => {
  setupAmbientCanvas();
  loadEntries();
  updateDateDisplay();
});
