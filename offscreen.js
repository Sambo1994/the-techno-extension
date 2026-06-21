// Simplified Techno Engine - Guaranteed to produce sound
console.log('Offscreen script loaded');

let audioContext = null;
let isRunning = false;
let gainNode = null;
let timerId = null;
let currentBPM = 128;
let beatCount = 0;
let state = {
  volume: 0.5,
  bpm: 128,
  preset: 'club'
};

// Simple note frequencies
const NOTES = {
  'C2': 65.41, 'D2': 73.42, 'E2': 82.41, 'F2': 87.31, 'G2': 98.00, 'A2': 110.00, 'B2': 123.47,
  'C3': 130.81, 'D3': 146.83, 'E3': 164.81, 'F3': 174.61, 'G3': 196.00, 'A3': 220.00, 'B3': 246.94,
  'C4': 261.63, 'D4': 293.66, 'E4': 329.63, 'F4': 349.23, 'G4': 392.00, 'A4': 440.00, 'B4': 493.88
};

// Initialize audio
async function initAudio() {
  try {
    console.log('Creating audio context...');
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    console.log('Audio context state:', audioContext.state);
    
    if (audioContext.state === 'suspended') {
      await audioContext.resume();
      console.log('Audio context resumed');
    }
    
    gainNode = audioContext.createGain();
    gainNode.gain.value = state.volume * 0.3;
    gainNode.connect(audioContext.destination);
    
    console.log('Audio initialized successfully!');
    console.log('Audio context state:', audioContext.state);
    return true;
  } catch (error) {
    console.error('Failed to initialize audio:', error);
    return false;
  }
}

// Play a kick drum
function playKick(time) {
  if (!audioContext || !gainNode) return;
  
  try {
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, time);
    osc.frequency.exponentialRampToValueAtTime(40, time + 0.1);
    
    gain.gain.setValueAtTime(0.4 * state.volume, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);
    
    osc.connect(gain);
    gain.connect(gainNode);
    
    osc.start(time);
    osc.stop(time + 0.15);
    
    console.log('Kick played at', time);
  } catch (e) {
    console.error('Kick error:', e);
  }
}

// Play a hi-hat
function playHiHat(time) {
  if (!audioContext || !gainNode) return;
  
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
    filter.frequency.value = 5000;
    
    gain.gain.setValueAtTime(0.1 * state.volume, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.03);
    
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(gainNode);
    
    noise.start(time);
    noise.stop(time + 0.04);
  } catch (e) {
    console.error('Hi-hat error:', e);
  }
}

// Play a clap
function playClap(time) {
  if (!audioContext || !gainNode) return;
  
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
    filter.frequency.value = 1500;
    filter.Q.value = 1;
    
    gain.gain.setValueAtTime(0.15 * state.volume, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);
    
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(gainNode);
    
    noise.start(time);
    noise.stop(time + 0.05);
  } catch (e) {
    console.error('Clap error:', e);
  }
}

// Play a bass note
function playBass(time) {
  if (!audioContext || !gainNode) return;
  
  try {
    const freq = 55 + Math.random() * 20; // Random bass frequency
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, time);
    
    gain.gain.setValueAtTime(0.15 * state.volume, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.25);
    
    osc.connect(gain);
    gain.connect(gainNode);
    
    osc.start(time);
    osc.stop(time + 0.3);
  } catch (e) {
    console.error('Bass error:', e);
  }
}

// Generate a beat
function generateBeat() {
  if (!audioContext || audioContext.state !== 'running') {
    console.log('Audio not ready, retrying...');
    if (audioContext && audioContext.state === 'suspended') {
      audioContext.resume();
    }
    return;
  }
  
  const now = audioContext.currentTime;
  const bpm = state.bpm || 128;
  const beatDuration = 60 / bpm;
  const beat = beatCount % 16;
  
  // Kick on every beat
  playKick(now);
  
  // Hi-hat on offbeats
  if (beat % 2 === 1) {
    playHiHat(now);
  }
  
  // Clap on 2 and 4 (beats 1 and 3 in 0-index)
  if (beat === 1 || beat === 3) {
    playClap(now);
  }
  
  // Bass on every other beat
  if (beat % 2 === 0) {
    playBass(now);
  }
  
  beatCount++;
  
  // Schedule next beat
  const nextTime = beatDuration * 1000;
  timerId = setTimeout(generateBeat, nextTime - 10);
}

// Start the music
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
  
  // Start generating beats
  generateBeat();
}

// Stop the music
function stopMusic() {
  console.log('Stopping music...');
  isRunning = false;
  if (timerId) {
    clearTimeout(timerId);
    timerId = null;
  }
}

// Update volume
function updateVolume(volume) {
  state.volume = volume;
  if (gainNode) {
    gainNode.gain.value = volume * 0.3;
  }
}

// Update BPM
function updateBPM(bpm) {
  state.bpm = bpm;
  console.log('BPM updated to:', bpm);
}

// Message handler
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
    state.preset = message.preset;
    sendResponse({ success: true });
    return true;
  }
});

console.log('Offscreen script ready');
console.log('Audio will start when message received');
