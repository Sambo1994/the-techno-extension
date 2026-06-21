// Popup controller for The Techno
const state = {
  isPlaying: true,
  volume: 0.7,
  bpm: 128,
  subgenre: 'deep',
  preset: 'club',
  noteCount: 0,
  startTime: Date.now()
};

const PRESETS = {
  club: { bpm: 128, subgenre: 'deep', description: 'Club' },
  warehouse: { bpm: 135, subgenre: 'industrial', description: 'Warehouse' },
  chillout: { bpm: 115, subgenre: 'deep', description: 'Chillout' },
  progressive: { bpm: 125, subgenre: 'melodic', description: 'Progressive' },
  techno: { bpm: 140, subgenre: 'industrial', description: 'Hard Techno' }
};

const elements = {
  playBtn: document.getElementById('playBtn'),
  playLabel: document.getElementById('playLabel'),
  volumeSlider: document.getElementById('volumeSlider'),
  volumeValue: document.getElementById('volumeValue'),
  presetBtns: document.querySelectorAll('.preset-btn'),
  subgenreBtns: document.querySelectorAll('.subgenre-btn'),
  statusBadge: document.getElementById('statusBadge'),
  timeDisplay: document.getElementById('timeDisplay'),
  noteDisplay: document.getElementById('noteDisplay'),
  noteCount: document.getElementById('noteCount'),
  presetDisplay: document.getElementById('presetDisplay'),
  bpmDisplay: document.getElementById('bpmDisplay'),
  visualizer: document.getElementById('visualizer')
};

// Create stars background
function createStars() {
  const bg = document.getElementById('galaxy-bg');
  for (let i = 0; i < 150; i++) {
    const star = document.createElement('div');
    star.className = 'star';
    const size = Math.random() * 2.5 + 0.5;
    star.style.width = size + 'px';
    star.style.height = size + 'px';
    star.style.left = Math.random() * 100 + '%';
    star.style.top = Math.random() * 100 + '%';
    star.style.setProperty('--duration', (3 + Math.random() * 5) + 's');
    star.style.animationDelay = Math.random() * 5 + 's';
    star.style.opacity = 0.3 + Math.random() * 0.5;
    bg.appendChild(star);
  }
}
createStars();

// Visualizer animation
function animateVisualizer() {
  const bars = elements.visualizer.querySelectorAll('.vis-bar');
  bars.forEach((bar) => {
    const height = 4 + Math.random() * 30;
    bar.style.height = height + 'px';
  });
}
setInterval(animateVisualizer, 150);

// Start audio in background
async function startBackgroundAudio() {
  try {
    await chrome.runtime.sendMessage({
      action: 'startAudio',
      preset: state.preset,
      volume: state.volume,
      bpm: state.bpm,
      subgenre: state.subgenre
    });
    console.log('Background audio started');
  } catch (error) {
    console.error('Failed to start background audio:', error);
  }
}

// Stop background audio
async function stopBackgroundAudio() {
  try {
    await chrome.runtime.sendMessage({ action: 'stopAudio' });
    console.log('Background audio stopped');
  } catch (error) {
    console.error('Failed to stop background audio:', error);
  }
}

// Update functions
async function updateVolume(volume) {
  try {
    await chrome.runtime.sendMessage({ action: 'updateVolume', volume });
  } catch (error) {
    console.error('Failed to update volume:', error);
  }
}

async function updateBPM(bpm) {
  try {
    await chrome.runtime.sendMessage({ action: 'updateBPM', bpm });
  } catch (error) {
    console.error('Failed to update BPM:', error);
  }
}

async function updateSubgenre(subgenre) {
  try {
    await chrome.runtime.sendMessage({ action: 'updateSubgenre', subgenre });
  } catch (error) {
    console.error('Failed to update subgenre:', error);
  }
}

async function updatePreset(preset) {
  try {
    await chrome.runtime.sendMessage({ action: 'updatePreset', preset });
  } catch (error) {
    console.error('Failed to update preset:', error);
  }
}

// UI Event Handlers
function setupUI() {
  elements.playBtn.addEventListener('click', togglePlay);

  elements.volumeSlider.addEventListener('input', (e) => {
    const val = parseInt(e.target.value);
    elements.volumeValue.textContent = val + '%';
    state.volume = val / 100;
    updateVolume(state.volume);
  });

  elements.presetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      elements.presetBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const preset = btn.dataset.preset;
      state.preset = preset;
      const config = PRESETS[preset];
      elements.presetDisplay.textContent = config.description;
      
      state.bpm = config.bpm;
      elements.bpmDisplay.textContent = state.bpm;
      updateBPM(state.bpm);
      
      state.subgenre = config.subgenre;
      elements.subgenreBtns.forEach(b => {
        b.classList.toggle('active', b.dataset.subgenre === config.subgenre);
      });
      updateSubgenre(state.subgenre);
      updatePreset(preset);
    });
  });

  elements.subgenreBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      elements.subgenreBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.subgenre = btn.dataset.subgenre;
      updateSubgenre(state.subgenre);
    });
  });
}

function togglePlay() {
  if (state.isPlaying) {
    state.isPlaying = false;
    elements.playBtn.classList.remove('active');
    elements.playLabel.textContent = 'Play';
    elements.playBtn.querySelector('.icon').textContent = '▶';
    elements.statusBadge.textContent = '⏸ PAUSED';
    elements.statusBadge.style.color = '#ffaa88';
    elements.statusBadge.style.borderColor = 'rgba(255,170,136,0.2)';
    stopBackgroundAudio();
  } else {
    state.isPlaying = true;
    elements.playBtn.classList.add('active');
    elements.playLabel.textContent = 'Pause';
    elements.playBtn.querySelector('.icon').textContent = '⏸';
    elements.statusBadge.textContent = '● LIVE';
    elements.statusBadge.style.color = '#00d4ff';
    elements.statusBadge.style.borderColor = 'rgba(0,200,255,0.15)';
    startBackgroundAudio();
  }
}

// Update time display
function updateTimeDisplay() {
  if (!state.isPlaying) return;
  const elapsed = (Date.now() - state.startTime) / 1000;
  const minutes = Math.floor(elapsed / 60);
  const seconds = Math.floor(elapsed % 60);
  elements.timeDisplay.textContent = 
    `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

// Listen for status updates from offscreen
chrome.runtime.onMessage.addListener((message) => {
  if (message.action === 'statusUpdate') {
    if (message.time) elements.timeDisplay.textContent = message.time;
    if (message.notes) {
      state.noteCount = message.notes;
      elements.noteCount.textContent = `${state.noteCount} notes`;
    }
  }
});

// Initialize
async function init() {
  setupUI();
  await startBackgroundAudio();
  setInterval(updateTimeDisplay, 1000);
}

window.addEventListener('beforeunload', () => {
  console.log('Popup closed, audio continues in background');
});

init();
