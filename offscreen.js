// Complete Techno Engine with Bass & Drone
console.log('Offscreen script loaded');

let audioContext = null;
let isRunning = false;
let masterGain = null;
let timerId = null;
let currentBPM = 128;
let beatCount = 0;
let droneOscillators = [];
let bassOscillators = [];
let isInitialized = false;

// State
let state = {
  volume: 0.5,
  bpm: 128,
  preset: 'club',
  noteCount: 0,
  startTime: Date.now()
};

// Preset configurations
const PRESETS = {
  club: { bpm: 128, bassPattern: 'sub', droneType: 'pad', density: 0.8 },
  warehouse: { bpm: 135, bassPattern: 'distorted', droneType: 'industrial', density: 0.9 },
  chillout: { bpm: 115, bassPattern: 'sub', droneType: 'ambient', density: 0.5 },
  progressive: { bpm: 125, bassPattern: 'melodic', droneType: 'pad', density: 0.7 },
  techno: { bpm: 140, bassPattern: 'distorted', droneType: 'industrial', density: 0.9 }
};

// Note frequencies
const NOTES = {
  'C1': 32.70, 'C#1': 34.65, 'D1': 36.71, 'D#1': 38.89, 'E1': 41.20, 'F1': 43.65, 'F#1': 46.25, 'G1': 49.00, 'G#1': 51.91, 'A1': 55.00, 'A#1': 58.27, 'B1': 61.74,
  'C2': 65.41, 'C#2': 69.30, 'D2': 73.42, 'D#2': 77.78, 'E2': 82.41, 'F2': 87.31, 'F#2': 92.50, 'G2': 98.00, 'G#2': 103.83, 'A2': 110.00, 'A#2': 116.54, 'B2': 123.47,
  'C3': 130.81, 'C#3': 138.59, 'D3': 146.83, 'D#3': 155.56, 'E3': 164.81, 'F3': 174.61, 'F#3': 185.00, 'G3': 196.00, 'G#3': 207.65, 'A3': 220.00, 'A#3': 233.08, 'B3': 246.94,
  'C4': 261.63, 'C#4': 277.18, 'D4': 293.66, 'D#4': 311.13, 'E4': 329.63, 'F4': 349.23, 'F#4': 369.99, 'G4': 392.00, 'G#4': 415.30, 'A4': 440.00, 'A#4': 466.16, 'B4': 493.88
};

// Bass note scales
const BASS_SCALES = {
  sub: ['C1', 'E1', 'G1', 'A1', 'C2', 'E2', 'G2', 'A2'],
  distorted: ['C1', 'D#1', 'F#1', 'G#1', 'C2', 'D#2', 'F#2', 'G#2'],
  melodic: ['C2', 'D2', 'E2', 'G2', 'A2', 'C3', 'D3', 'E3', 'G3', 'A3'],
  drone: ['C1', 'G1', 'C2', 'G2']
};

// Drone note scales
const DRONE_SCALES = {
  pad: ['C2', 'E2', 'G2', 'B2', 'C3', 'E3', 'G3', 'B3'],
  ambient: ['C2', 'F2', 'G2', 'C3', 'F3', 'G3'],
  industrial: ['C1', 'G1', 'D2', 'G2', 'C3'],
  chord: ['C2', 'E2', 'G2', 'C3', 'E3', 'G3']
};

// Initialize audio
async function initAudio() {
  try {
    console.log('Creating audio context...');
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    if (audioContext.state === 'suspended') {
      await audioContext.resume();
      console.log('Audio context resumed');
    }
    
    masterGain = audioContext.createGain();
    masterGain.gain.value = state.volume * 0.3;
    masterGain.connect(audioContext.destination);
    
    isInitialized = true;
    console.log('Audio initialized successfully!');
    console.log('Audio context state:', audioContext.state);
    return true;
  } catch (error) {
    console.error('Failed to initialize audio:', error);
    return false;
  }
}

// ==================== KICK DRUM ====================
function playKick(time, velocity = 0.8) {
  if (!audioContext || !masterGain) return;
  
  try {
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, time);
    osc.frequency.exponentialRampToValueAtTime(35, time + 0.12);
    
    gain.gain.setValueAtTime(velocity * 0.5 * state.volume, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);
    
    osc.connect(gain);
    gain.connect(masterGain);
    
    osc.start(time);
    osc.stop(time + 0.15);
  } catch (e) {}
}

// ==================== HI-HAT ====================
function playHiHat(time, velocity = 0.6) {
  if (!audioContext || !masterGain) return;
  
  try {
    const bufferSize = audioContext.sampleRate * 0.03;
    const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.05));
    }
    
    const noise = audioContext.createBufferSource();
    noise.buffer = buffer;
    
    const gain = audioContext.createGain();
    const filter = audioContext.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 6000;
    
    gain.gain.setValueAtTime(velocity * 0.12 * state.volume, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.03);
    
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);
    
    noise.start(time);
    noise.stop(time + 0.04);
  } catch (e) {}
}

// ==================== CLAP ====================
function playClap(time, velocity = 0.7) {
  if (!audioContext || !masterGain) return;
  
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
    
    gain.gain.setValueAtTime(velocity * 0.2 * state.volume, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);
    
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);
    
    noise.start(time);
    noise.stop(time + 0.05);
  } catch (e) {}
}

// ==================== BASS INSTRUMENT ====================
function playBass(time, velocity = 0.7, pattern = 'sub') {
  if (!audioContext || !masterGain) return;
  
  try {
    const scale = BASS_SCALES[pattern] || BASS_SCALES.sub;
    const note = scale[Math.floor(Math.random() * scale.length)];
    const freq = NOTES[note] || 65.41;
    
    // Bass oscillator
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const filter = audioContext.createBiquadFilter();
    
    // Different waveforms for different bass types
    if (pattern === 'sub') {
      osc.type = 'sine';
      filter.type = 'lowpass';
      filter.frequency.value = 200;
    } else if (pattern === 'distorted') {
      osc.type = 'sawtooth';
      filter.type = 'lowpass';
      filter.frequency.value = 400;
      // Add distortion effect
      const distGain = audioContext.createGain();
      distGain.gain.value = 0.5;
      osc.connect(distGain);
      distGain.connect(filter);
    } else {
      osc.type = 'triangle';
      filter.type = 'lowpass';
      filter.frequency.value = 300;
    }
    
    osc.frequency.setValueAtTime(freq, time);
    
    // Envelope
    gain.gain.setValueAtTime(0.001, time);
    gain.gain.exponentialRampToValueAtTime(velocity * 0.25 * state.volume, time + 0.01);
    gain.gain.exponentialRampToValueAtTime(velocity * 0.15 * state.volume, time + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.3);
    
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);
    
    osc.start(time);
    osc.stop(time + 0.35);
    
    // Store for cleanup
    bassOscillators.push({ osc, gain, filter });
    setTimeout(() => {
      bassOscillators = bassOscillators.filter(o => o.osc !== osc);
    }, 400);
  } catch (e) {}
}

// ==================== DRONE INSTRUMENT ====================
function playDrone(time, duration = 2.0, velocity = 0.5, type = 'pad') {
  if (!audioContext || !masterGain) return;
  
  try {
    const scale = DRONE_SCALES[type] || DRONE_SCALES.pad;
    const noteCount = 2 + Math.floor(Math.random() * 3); // 2-4 notes
    const selectedNotes = [];
    
    // Select random notes from scale
    for (let i = 0; i < noteCount; i++) {
      const idx = Math.floor(Math.random() * scale.length);
      selectedNotes.push(scale[idx]);
    }
    
    selectedNotes.forEach((note, index) => {
      const freq = NOTES[note];
      if (!freq) return;
      
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      const filter = audioContext.createBiquadFilter();
      
      // Different drone types
      if (type === 'pad') {
        osc.type = 'sine';
        filter.type = 'lowpass';
        filter.frequency.value = 800;
        filter.Q.value = 2;
      } else if (type === 'ambient') {
        osc.type = 'sine';
        filter.type = 'bandpass';
        filter.frequency.value = 500 + Math.random() * 300;
        filter.Q.value = 1;
      } else if (type === 'industrial') {
        osc.type = 'sawtooth';
        filter.type = 'lowpass';
        filter.frequency.value = 300;
        filter.Q.value = 3;
      } else {
        osc.type = 'triangle';
        filter.type = 'lowpass';
        filter.frequency.value = 600;
        filter.Q.value = 2;
      }
      
      const startTime = time + index * 0.1;
      osc.frequency.setValueAtTime(freq, startTime);
      
      // Slow attack and release for drone
      const droneVelocity = velocity * (0.3 + Math.random() * 0.3);
      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.exponentialRampToValueAtTime(droneVelocity * 0.12 * state.volume, startTime + 0.2);
      gain.gain.exponentialRampToValueAtTime(droneVelocity * 0.08 * state.volume, startTime + duration * 0.5);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
      
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(masterGain);
      
      osc.start(startTime);
      osc.stop(startTime + duration + 0.1);
      
      // Store for cleanup
      droneOscillators.push({ osc, gain, filter });
      setTimeout(() => {
        droneOscillators = droneOscillators.filter(o => o.osc !== osc);
      }, (duration + 0.2) * 1000);
    });
  } catch (e) {}
}

// ==================== GENERATE BEAT ====================
function generateBeat() {
  if (!audioContext || audioContext.state !== 'running') {
    if (audioContext && audioContext.state === 'suspended') {
      audioContext.resume();
    }
    return;
  }
  
  const now = audioContext.currentTime;
  const bpm = state.bpm || 128;
  const beatDuration = 60 / bpm;
  const beat = beatCount % 16;
  const bar = Math.floor(beatCount / 16);
  const preset = PRESETS[state.preset] || PRESETS.club;
  const density = preset.density || 0.7;
  
  // === KICK - 4x4 ===
  if (beat % 4 === 0) {
    playKick(now, 0.7 + Math.random() * 0.2);
  }
  
  // === HI-HAT - Offbeat with variations ===
  if (beat % 2 === 1 && Math.random() < density) {
    playHiHat(now, 0.3 + Math.random() * 0.2);
  }
  // Extra hats
  if (Math.random() < 0.3 && beat % 2 === 0) {
    playHiHat(now + beatDuration * 0.25, 0.2 + Math.random() * 0.1);
  }
  if (Math.random() < 0.3 && beat % 2 === 1) {
    playHiHat(now + beatDuration * 0.75, 0.2 + Math.random() * 0.1);
  }
  
  // === CLAP - On 2 and 4 ===
  if (beat === 1 || beat === 3) {
    playClap(now, 0.5 + Math.random() * 0.2);
  }
  // Extra claps
  if (beat === 5 || beat === 7 || beat === 9 || beat === 11) {
    if (Math.random() < 0.3) {
      playClap(now, 0.3 + Math.random() * 0.2);
    }
  }
  
  // === BASS - On every other beat ===
  const bassPattern = preset.bassPattern || 'sub';
  if (beat % 2 === 0 && Math.random() < 0.7) {
    playBass(now, 0.5 + Math.random() * 0.3, bassPattern);
  }
  // Offbeat bass
  if (beat % 4 === 1 && Math.random() < 0.3) {
    playBass(now + beatDuration * 0.5, 0.3 + Math.random() * 0.2, bassPattern);
  }
  
  // === DRONE - Every 4 beats (bar) ===
  const droneType = preset.droneType || 'pad';
  if (beat % 4 === 0) {
    // Sometimes play drone, sometimes skip for variation
    if (Math.random() < 0.6) {
      const duration = 2 + Math.random() * 2;
      const velocity = 0.3 + Math.random() * 0.3;
      playDrone(now + 0.1, duration, velocity, droneType);
    }
  }
  
  // Extra drone on 8th beat for variation
  if (beat % 8 === 0 && Math.random() < 0.4) {
    const duration = 1.5 + Math.random() * 1.5;
    playDrone(now + 0.2, duration, 0.2 + Math.random() * 0.2, droneType);
  }
  
  // === SYNTH FILLS - Occasionally ===
  if (beat === 6 || beat === 14) {
    if (Math.random() < 0.4) {
      // Short synth stab
      playSynthStab(now, 0.3 + Math.random() * 0.2);
    }
  }
  
  beatCount++;
  
  // Update note count
  state.noteCount += 1 + Math.floor(Math.random() * 2);
  
  // Update status periodically
  if (beatCount % 4 === 0) {
    updateStatus();
  }
  
  // Schedule next beat
  const nextTime = beatDuration * 1000;
  timerId = setTimeout(generateBeat, nextTime - 5);
}

// ==================== SYNTH STAB ====================
function playSynthStab(time, velocity = 0.5) {
  if (!audioContext || !masterGain) return;
  
  try {
    const notes = ['C4', 'E4', 'G4', 'B4'];
    const note = notes[Math.floor(Math.random() * notes.length)];
    const freq = NOTES[note] || 261.63;
    
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const filter = audioContext.createBiquadFilter();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, time);
    
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2000, time);
    filter.frequency.exponentialRampToValueAtTime(500, time + 0.15);
    
    gain.gain.setValueAtTime(0.001, time);
    gain.gain.exponentialRampToValueAtTime(velocity * 0.15 * state.volume, time + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.2);
    
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);
    
    osc.start(time);
    osc.stop(time + 0.25);
  } catch (e) {}
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

// ==================== START / STOP ====================
async function startMusic() {
  console.log('Starting music...');
  
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
  
  console.log('Audio is ready, starting beats...');
  beatCount = 0;
  isRunning = true;
  state.startTime = Date.now();
  state.noteCount = 0;
  
  generateBeat();
}

function stopMusic() {
  console.log('Stopping music...');
  isRunning = false;
  if (timerId) {
    clearTimeout(timerId);
    timerId = null;
  }
  
  // Clean up oscillators
  droneOscillators.forEach(({ osc }) => {
    try { osc.stop(); } catch (e) {}
  });
  droneOscillators = [];
  
  bassOscillators.forEach(({ osc }) => {
    try { osc.stop(); } catch (e) {}
  });
  bassOscillators = [];
}

// ==================== UPDATE FUNCTIONS ====================
function updateVolume(volume) {
  state.volume = volume;
  if (masterGain) {
    masterGain.gain.value = volume * 0.3;
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
    console.log('Start techno requested');
    
    if (message.volume !== undefined) {
      state.volume = message.volume;
    }
    if (message.bpm) {
      state.bpm = message.bpm;
    }
    if (message.preset) {
      state.preset = message.preset;
    }
    
    await startMusic();
    sendResponse({ success: true });
    return true;
  }
  
  if (message.action === 'stopTechno') {
    console.log('Stop techno requested');
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

console.log('Offscreen script ready with Bass & Drone');
