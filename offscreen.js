// Complete Techno Engine - True 4x4 Beat with Proper Pause
console.log('Offscreen script loaded');

let audioContext = null;
let isRunning = false;
let masterGain = null;
let timerId = null;
let currentBPM = 128;
let beatCount = 0;
let isPaused = false;  // <-- NEW: Separate pause state

// State
let state = {
  volume: 0.5,
  bpm: 128,
  preset: 'club',
  noteCount: 0,
  startTime: Date.now()
};

// ... (Presets, NOTES, BASS_SCALES, DRONE_SCALES remain the same as before) ...
// For brevity, I'm keeping the existing preset and scale definitions here.
// Please copy them from your previous offscreen.js file.

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

// ==================== INSTRUMENTS ====================
// (Keep your existing playKick, playHiHat, playClap, playBass, playDrone functions here)
// Ensure they all check for 'isPaused' and return if true.

function playKick(time, velocity = 0.9) { // <-- Increased default velocity
  if (!audioContext || !masterGain || isPaused) return; // <-- Check pause state
  
  try {
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, time);
    osc.frequency.exponentialRampToValueAtTime(30, time + 0.1);
    
    gain.gain.setValueAtTime(velocity * 0.6 * state.volume, time); // <-- Louder
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);
    
    osc.connect(gain);
    gain.connect(masterGain);
    
    osc.start(time);
    osc.stop(time + 0.15);
  } catch (e) {}
}

// ... (Add similar isPaused checks to playHiHat, playClap, etc.) ...

// ==================== TRUE TECHNO BEAT ====================
function generateBeat() {
  // --- CRITICAL: Stop if paused or not running ---
  if (isPaused || !isRunning) {
    // If paused, keep checking until resumed or stopped
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
  const preset = PRESETS[state.preset] || PRESETS.club;
  const density = preset.density || 0.7;

  // --- THE CORE 4x4 KICK ---
  // Kick on EVERY beat (0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15)
  // This is the essential techno pattern.
  if (true) { // Always play the kick
    playKick(now, 0.8 + Math.random() * 0.15);
  }

  // --- HI-HAT (Off-beat and variations) ---
  // Standard off-beat: on every 8th note (positions 1, 3, 5, 7, 9, 11, 13, 15)
  if (beat % 2 === 1 && Math.random() < density) {
    playHiHat(now, 0.3 + Math.random() * 0.2);
  }
  // Add some shuffle or extra hats
  if (Math.random() < 0.2 && beat % 2 === 0) {
    playHiHat(now + beatDuration * 0.25, 0.15 + Math.random() * 0.1);
  }
  if (Math.random() < 0.2 && beat % 2 === 1) {
    playHiHat(now + beatDuration * 0.75, 0.15 + Math.random() * 0.1);
  }

  // --- CLAP/Snare (On 2 and 4) ---
  if (beat === 1 || beat === 3) { // Beats 2 and 4 (0-indexed)
    playClap(now, 0.5 + Math.random() * 0.2);
  }
  // Extra claps for warehouse feel
  if (beat === 5 || beat === 7 || beat === 9 || beat === 11) {
    if (Math.random() < 0.2) {
      playClap(now, 0.2 + Math.random() * 0.15);
    }
  }

  // --- BASS (Syncopated) ---
  // Play bass on the 1st and 3rd beat of every bar (positions 0, 2, 4, 6, etc.)
  const bassPattern = preset.bassPattern || 'sub';
  if (beat % 2 === 0 && Math.random() < 0.75) { // High probability
    playBass(now, 0.5 + Math.random() * 0.3, bassPattern);
  }
  // Add a syncopated bass hit (off-beat)
  if (beat % 4 === 1 && Math.random() < 0.25) {
    playBass(now + beatDuration * 0.5, 0.3 + Math.random() * 0.2, bassPattern);
  }

  // --- DRONE (Atmospheric Texture) ---
  const droneType = preset.droneType || 'pad';
  // Trigger drone on the 1st beat of every bar (positions 0, 4, 8, 12)
  if (beat % 4 === 0) {
    if (Math.random() < 0.6) { // 60% chance per bar
      const duration = 2 + Math.random() * 2;
      const velocity = 0.25 + Math.random() * 0.25;
      playDrone(now + 0.1, duration, velocity, droneType);
    }
  }
  // Occasional drone on the 3rd beat for variation
  if (beat % 4 === 2 && Math.random() < 0.25) {
    const duration = 1.5 + Math.random() * 1.5;
    playDrone(now + 0.1, duration, 0.15 + Math.random() * 0.15, droneType);
  }

  // --- SYNTH STAB (Occasional Accent) ---
  // Accent on the 2nd and 4th beat of the bar
  if ((beat === 1 || beat === 3) && Math.random() < 0.3) {
    playSynthStab(now, 0.2 + Math.random() * 0.15);
  }

  beatCount++;
  state.noteCount += 2 + Math.floor(Math.random() * 3);

  // Update status every 4 beats
  if (beatCount % 4 === 0) {
    updateStatus();
  }

  // --- SCHEDULE NEXT BEAT ---
  const nextTime = beatDuration * 1000;
  timerId = setTimeout(generateBeat, nextTime - 5);
}

// ==================== PLAY/PAUSE CONTROLS ====================
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
  }
  
  if (audioContext.state !== 'running') {
    console.error('Audio context not running:', audioContext.state);
    return;
  }
  
  console.log('Audio is ready, starting beats...');
  isRunning = true;
  isPaused = false; // <-- Ensure not paused
  beatCount = 0;
  state.startTime = Date.now();
  state.noteCount = 0;
  
  // Start the beat loop
  generateBeat();
}

function pauseMusic() {
  console.log('Pausing music...');
  isPaused = true; // <-- This stops the beat generation loop
  if (timerId) {
    clearTimeout(timerId);
    timerId = null;
  }
}

function resumeMusic() {
  console.log('Resuming music...');
  if (isPaused && isRunning) {
    isPaused = false;
    // Resume the beat loop
    generateBeat();
  }
}

function stopMusic() {
  console.log('Stopping music...');
  isRunning = false;
  isPaused = false;
  if (timerId) {
    clearTimeout(timerId);
    timerId = null;
  }
  // Clean up any hanging oscillators (keep your existing cleanup)
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
    
    // If already running, just resume
    if (isRunning && isPaused) {
      resumeMusic();
    } else {
      await startMusic();
    }
    
    sendResponse({ success: true });
    return true;
  }
  
  if (message.action === 'stopTechno') {
    console.log('Stop/Pause techno requested');
    if (isRunning) {
      if (isPaused) {
        // If already paused, fully stop
        stopMusic();
      } else {
        // Otherwise, just pause
        pauseMusic();
      }
    }
    sendResponse({ success: true });
    return true;
  }
  
  // ... (Keep other update handlers: updateVolume, updateBPM, updatePreset) ...
});

console.log('Techno engine ready with true 4x4 beat and proper pause');
