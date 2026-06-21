// Complete Techno Engine - 4/4 Kick + Techno Hi-Hats
console.log('Offscreen script loaded');

let audioContext = null;
let isRunning = false;
let isPaused = false;
let masterGain = null;
let timerId = null;
let beatCount = 0;
let isInitialized = false;
let isAudioReady = false;

// State
let state = {
  volume: 0.7,
  bpm: 128,
  preset: 'club',
  noteCount: 0,
  startTime: Date.now()
};

// Preset configurations
const PRESETS = {
  club: { bpm: 128, description: 'Club' },
  warehouse: { bpm: 135, description: 'Warehouse' },
  chillout: { bpm: 115, description: 'Chillout' },
  progressive: { bpm: 125, description: 'Progressive' },
  techno: { bpm: 140, description: 'Hard' }
};

// ==================== INITIALIZATION ====================
async function initAudio() {
  try {
    console.log('Creating audio context...');
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    if (audioContext.state === 'suspended') {
      await audioContext.resume();
      console.log('Audio context resumed');
    }
    
    masterGain = audioContext.createGain();
    masterGain.gain.value = state.volume * 0.4;
    masterGain.connect(audioContext.destination);
    
    isInitialized = true;
    isAudioReady = true;
    console.log('Audio initialized successfully!');
    console.log('Audio context state:', audioContext.state);
    
    // Test sound to verify audio works
    testSound();
    return true;
  } catch (error) {
    console.error('Failed to initialize audio:', error);
    return false;
  }
}

function testSound() {
  try {
    if (!audioContext || !masterGain) return;
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    osc.type = 'sine';
    osc.frequency.value = 440;
    gain.gain.setValueAtTime(0.05, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.1);
    osc.connect(gain);
    gain.connect(masterGain);
    osc.start();
    osc.stop(audioContext.currentTime + 0.1);
    console.log('✅ Test beep played - audio working!');
  } catch (e) {
    console.log('Test sound failed:', e);
  }
}

// ==================== KICK DRUM - 4/4 ====================
function playKick(time, velocity = 0.9) {
  if (!audioContext || !masterGain || isPaused) return;
  
  try {
    // Main kick body
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(120, time);
    osc.frequency.exponentialRampToValueAtTime(35, time + 0.1);
    
    gain.gain.setValueAtTime(velocity * 0.6 * state.volume, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);
    
    osc.connect(gain);
    gain.connect(masterGain);
    
    osc.start(time);
    osc.stop(time + 0.12);
    
    // Click attack for punch
    const bufferSize = audioContext.sampleRate * 0.005;
    const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.1));
    }
    const noise = audioContext.createBufferSource();
    noise.buffer = buffer;
    const noiseGain = audioContext.createGain();
    const noiseFilter = audioContext.createBiquadFilter();
    noiseFilter.type = 'highpass';
    noiseFilter.frequency.value = 3000;
    noiseGain.gain.setValueAtTime(0.15 * state.volume, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.01);
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(masterGain);
    noise.start(time);
    noise.stop(time + 0.015);
  } catch (e) {}
}

// ==================== TECHNO HI-HAT ====================
function playHiHat(time, velocity = 0.6, type = 'closed') {
  if (!audioContext || !masterGain || isPaused) return;
  
  try {
    const bufferSize = audioContext.sampleRate * 0.04;
    const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    
    // Different decay for open vs closed hi-hat
    const decay = type === 'open' ? 0.15 : 0.04;
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * decay));
    }
    
    const noise = audioContext.createBufferSource();
    noise.buffer = buffer;
    
    const gain = audioContext.createGain();
    const filter = audioContext.createBiquadFilter();
    
    // Techno hi-hats are bright and crisp
    filter.type = 'bandpass';
    filter.frequency.value = type === 'open' ? 4000 : 7000;
    filter.Q.value = 1.2;
    
    const duration = type === 'open' ? 0.08 : 0.035;
    gain.gain.setValueAtTime(velocity * 0.15 * state.volume, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
    
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);
    
    noise.start(time);
    noise.stop(time + duration + 0.01);
  } catch (e) {}
}

// ==================== CLAP ====================
function playClap(time) {
  if (!audioContext || !masterGain || isPaused) return;
  
  try {
    const bufferSize = audioContext.sampleRate * 0.04;
    const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.15));
    }
    
    const noise = audioContext.createBufferSource();
    noise.buffer = buffer;
    
    const gain = audioContext.createGain();
    const filter = audioContext.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 2000;
    filter.Q.value = 1;
    
    gain.gain.setValueAtTime(0.2 * state.volume, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);
    
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);
    
    noise.start(time);
    noise.stop(time + 0.05);
  } catch (e) {}
}

// ==================== BASS ====================
function playBass(time) {
  if (!audioContext || !masterGain || isPaused) return;
  
  try {
    const freq = 50 + Math.random() * 25;
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const filter = audioContext.createBiquadFilter();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, time);
    
    filter.type = 'lowpass';
    filter.frequency.value = 250;
    filter.Q.value = 2;
    
    gain.gain.setValueAtTime(0.2 * state.volume, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.25);
    
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);
    
    osc.start(time);
    osc.stop(time + 0.3);
  } catch (e) {}
}

// ==================== GENERATE BEAT - 4/4 WITH TECHNO HI-HATS ====================
function generateBeat() {
  // Check if we should stop
  if (isPaused || !isRunning) {
    if (isPaused) {
      timerId = setTimeout(generateBeat, 50);
    }
    return;
  }

  if (!audioContext || audioContext.state !== 'running') {
    if (audioContext && audioContext.state === 'suspended') {
      audioContext.resume();
    }
    timerId = setTimeout(generateBeat, 100);
    return;
  }
  
  const now = audioContext.currentTime;
  const bpm = state.bpm || 128;
  const beatDuration = 60 / bpm;
  const beat = beatCount % 16; // 16 beats = 4 bars
  const bar = Math.floor(beatCount / 16);
  
  // ========== 4/4 KICK - ON EVERY BEAT ==========
  playKick(now);
  
  // ========== TECHNO HI-HAT PATTERN ==========
  // Standard techno: closed hi-hat on every 8th note (off-beat)
  if (beat % 2 === 1) {
    playHiHat(now, 0.5 + Math.random() * 0.2, 'closed');
  }
  
  // Open hi-hat on the 4th beat of every bar for accent
  if (beat % 4 === 3) {
    playHiHat(now, 0.4 + Math.random() * 0.2, 'open');
  }
  
  // Extra closed hi-hats for driving rhythm
  if (beat % 4 === 0 && Math.random() < 0.3) {
    playHiHat(now + beatDuration * 0.5, 0.3 + Math.random() * 0.1, 'closed');
  }
  if (beat % 4 === 1 && Math.random() < 0.3) {
    playHiHat(now + beatDuration * 0.25, 0.3 + Math.random() * 0.1, 'closed');
  }
  if (beat % 4 === 2 && Math.random() < 0.3) {
    playHiHat(now + beatDuration * 0.75, 0.3 + Math.random() * 0.1, 'closed');
  }
  
  // ========== CLAP - ON 2 AND 4 ==========
  if (beat === 1 || beat === 3) {
    playClap(now);
  }
  // Extra claps for warehouse feel
  if (beat === 5 || beat === 7 || beat === 9 || beat === 11) {
    if (Math.random() < 0.3) {
      playClap(now);
    }
  }
  
  // ========== BASS - ON EVERY OTHER BEAT ==========
  if (beat % 2 === 0) {
    playBass(now);
  }
  // Offbeat bass
  if (beat % 4 === 1 && Math.random() < 0.3) {
    playBass(now + beatDuration * 0.5);
  }
  
  beatCount++;
  state.noteCount += 2 + Math.floor(Math.random() * 2);
  
  // Update status every 4 beats
  if (beatCount % 4 === 0) {
    updateStatus();
    // Send kick update for visualizer
    try {
      chrome.runtime.sendMessage({
        action: 'kickUpdate',
        beat: beatCount % 8
      }).catch(() => {});
    } catch (e) {}
  }
  
  // ========== SCHEDULE NEXT BEAT ==========
  const nextTime = beatDuration * 1000;
  timerId = setTimeout(generateBeat, nextTime - 5);
}

// ==================== STATUS UPDATE ====================
function updateStatus() {
  const elapsed = (Date.now() - state.startTime) / 1000;
  const minutes = Math.floor(elapsed / 60);
  const seconds = Math.floor(elapsed % 60);
  
  try {
    chrome.runtime.sendMessage({
      action: 'statusUpdate',
      time: `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`,
      notes: state.noteCount
    }).catch(() => {});
  } catch (e) {}
}

// ==================== START / STOP / PAUSE ====================
async function startMusic() {
  console.log('Starting music...');
  
  // Reset any existing state
  if (timerId) {
    clearTimeout(timerId);
    timerId = null;
  }
  
  if (!audioContext) {
    const success = await initAudio();
    if (!success) {
      console.error('Failed to initialize audio');
      return;
    }
  }
  
  if (audioContext.state === 'suspended') {
    await audioContext.resume();
    console.log('Audio context resumed');
  }
  
  if (audioContext.state !== 'running') {
    console.error('Audio context not running:', audioContext.state);
    return;
  }
  
  console.log('✅ Audio is ready, starting 4/4 techno beat...');
  isRunning = true;
  isPaused = false;
  beatCount = 0;
  state.startTime = Date.now();
  state.noteCount = 0;
  
  // Start the beat loop
  generateBeat();
}

function pauseMusic() {
  console.log('⏸ Pausing music...');
  isPaused = true;
  if (timerId) {
    clearTimeout(timerId);
    timerId = null;
  }
}

function resumeMusic() {
  console.log('▶ Resuming music...');
  if (isPaused && isRunning) {
    isPaused = false;
    generateBeat();
  }
}

function stopMusic() {
  console.log('⏹ Stopping music...');
  isRunning = false;
  isPaused = false;
  if (timerId) {
    clearTimeout(timerId);
    timerId = null;
  }
}

// ==================== UPDATE FUNCTIONS ====================
function updateVolume(volume) {
  state.volume = volume;
  if (masterGain) {
    masterGain.gain.value = volume * 0.4;
  }
}

function updateBPM(bpm) {
  state.bpm = bpm;
  console.log('BPM updated to:', bpm);
}

function updatePreset(preset) {
  state.preset = preset;
  console.log('Preset updated to:', preset);
}

// ==================== MESSAGE HANDLER ====================
chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  console.log('Message received:', message.action);
  
  if (message.action === 'ping') {
    sendResponse({ success: true });
    return true;
  }
  
  if (message.action === 'startTechno') {
    console.log('▶ Start techno requested');
    
    if (message.volume !== undefined) {
      state.volume = message.volume;
    }
    if (message.bpm) {
      state.bpm = message.bpm;
    }
    if (message.preset) {
      state.preset = message.preset;
    }
    
    // If already running, restart fresh
    if (isRunning) {
      stopMusic();
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    await startMusic();
    sendResponse({ success: true });
    return true;
  }
  
  if (message.action === 'stopTechno') {
    console.log('⏹ Stop techno requested');
    stopMusic();
    sendResponse({ success: true });
    return true;
  }
  
  if (message.action === 'updateVolume') {
    updateVolume(message.volume);
    sendResponse({ success: true });
    return true;
  }
  
  if (message.action === 'updateBPM') {
    updateBPM(message.bpm);
    sendResponse({ success: true });
    return true;
  }
  
  if (message.action === 'updatePreset') {
    updatePreset(message.preset);
    sendResponse({ success: true });
    return true;
  }
});

console.log('✅ Techno engine ready with 4/4 kick + techno hi-hats');
