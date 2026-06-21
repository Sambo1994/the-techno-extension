const state = {
  isPlaying: true,
  volume: 0.7,
  bpm: 128,
  preset: 'club',
  noteCount: 0,
  startTime: Date.now()
};

const PRESETS = {
  club: { bpm: 128, description: 'Club' },
  warehouse: { bpm: 135, description: 'Warehouse' },
  chillout: { bpm: 115, description: 'Chillout' },
  progressive: { bpm: 125, description: 'Progressive' },
  techno: { bpm: 140, description: 'Hard' }
};

const elements = {
  playBtn: document.getElementById('playBtn'),
  playLabel: document.getElementById('playLabel'),
  volumeSlider: document.getElementById('volumeSlider'),
  volumeValue: document.getElementById('volumeValue'),
  presetBtns: document.querySelectorAll('.preset-btn'),
  statusBadge: document.getElementById('statusBadge'),
  timeDisplay: document.getElementById('timeDisplay'),
  noteCount: document.getElementById('noteCount'),
  presetDisplay: document.getElementById('presetDisplay'),
  bpmDisplay: document.getElementById('bpmDisplay')
};

// Create stars
function createStars() {
  const bg = document.getElementById('galaxy-bg');
  for (let i = 0; i < 100; i++) {
    const star = document.createElement('div');
    star.className = 'star';
    const size = Math.random() * 2 + 0.5;
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

// Audio functions
async function startAudio() {
  try {
    await chrome.runtime.sendMessage({
      action: 'startAudio',
      preset: state.preset,
      volume: state.volume,
      bpm: state.bpm
    });
    console.log('Audio started');
  } catch (error) {
    console.error('Failed to start audio:', error);
  }
}

async function stopAudio() {
  try {
    await chrome.runtime.sendMessage({ action: 'stopAudio' });
    console.log('Audio stopped');
  } catch (error) {
    console.error('Failed to stop audio:', error);
  }
}

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

async function updatePreset(preset) {
  try {
    await chrome.runtime.sendMessage({ action: 'updatePreset', preset });
  } catch (error) {
    console.error('Failed to update preset:', error);
  }
}

// UI Setup
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
      updatePreset(preset);
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
    stopAudio();
  } else {
    state.isPlaying = true;
    elements.playBtn.classList.add('active');
    elements.playLabel.textContent = 'Pause';
    elements.playBtn.querySelector('.icon').textContent = '⏸';
    elements.statusBadge.textContent = '● LIVE';
    elements.statusBadge.style.color = '#00d4ff';
    startAudio();
  }
}

function updateTimeDisplay() {
  if (!state.isPlaying) return;
  const elapsed = (Date.now() - state.startTime) / 1000;
  const minutes = Math.floor(elapsed / 60);
  const seconds = Math.floor(elapsed % 60);
  elements.timeDisplay.textContent = 
    `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

// Listen for status updates
chrome.runtime.onMessage.addListener((message) => {
  if (message.action === 'statusUpdate') {
    if (message.time) elements.timeDisplay.textContent = message.time;
    if (message.notes) {
      state.noteCount = message.notes;
      elements.noteCount.textContent = `${state.noteCount} notes`;
    }
  }
});

async function init() {
  setupUI();
  await startAudio();
  setInterval(updateTimeDisplay, 1000);
  setInterval(() => {
    if (state.isPlaying) {
      state.noteCount += Math.floor(Math.random() * 3) + 1;
      elements.noteCount.textContent = `${state.noteCount} notes`;
    }
  }, 2000);
}

init();
