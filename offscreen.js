// Complete Techno Engine - Working Version
console.log('Offscreen script loaded');

let audioContext = null;
let isPlaying = false;
let masterGain = null;
let compressor = null;
let isInitialized = false;
let currentBPM = 128;
let musicGenerator = null;
let initAttempts = 0;
let noteTimers = [];

// Preset configurations
const PRESETS = {
  club: {
    bpm: 128,
    subgenre: 'deep',
    density: 0.8,
    complexity: 4,
    description: 'Club'
  },
  warehouse: {
    bpm: 135,
    subgenre: 'industrial',
    density: 0.9,
    complexity: 5,
    description: 'Warehouse'
  },
  chillout: {
    bpm: 115,
    subgenre: 'deep',
    density: 0.5,
    complexity: 3,
    description: 'Chillout'
  },
  progressive: {
    bpm: 125,
    subgenre: 'melodic',
    density: 0.7,
    complexity: 4,
    description: 'Progressive'
  },
  techno: {
    bpm: 140,
    subgenre: 'industrial',
    density: 0.9,
    complexity: 5,
    description: 'Hard Techno'
  }
};

// Note frequencies
const NOTE_FREQUENCIES = {
  'C2': 65.41, 'D2': 73.42, 'E2': 82.41, 'F2': 87.31, 'G2': 98.00, 'A2': 110.00, 'B2': 123.47,
  'C3': 130.81, 'D3': 146.83, 'E3': 164.81, 'F3': 174.61, 'G3': 196.00, 'A3': 220.00, 'B3': 246.94,
  'C4': 261.63, 'D4': 293.66, 'E4': 329.63, 'F4': 349.23, 'G4': 392.00, 'A4': 440.00, 'B4': 493.88,
  'C5': 523.25, 'D5': 587.33, 'E5': 659.25, 'F5': 698.46, 'G5': 783.99, 'A5': 880.00, 'B5': 987.77
};

const TECHNO_SCALE = ['C2', 'D2', 'E2', 'G2', 'A2', 'C3', 'D3', 'E3', 'G3', 'A3', 'C4', 'D4', 'E4', 'G4', 'A4'];

let state = {
  preset: 'club',
  volume: 0.7,
  bpm: 128,
  subgenre: 'deep',
  noteCount: 0,
  startTime: Date.now()
};

// Techno Engine
class TechnoEngine {
  constructor() {
    this.audioContext = null;
    this.masterGain = null;
    this.compressor = null;
    this.reverbNode = null;
    this.delayNode = null;
    this.isInitialized = false;
  }

  async init() {
    if (this.isInitialized && this.audioContext && this.audioContext.state === 'running') {
      return;
    }
    
    if (this.isInitialized && this.audioContext && this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
      return;
    }
    
    try {
      console.log('Initializing audio context...');
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // Resume immediately
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }
      
      console.log('Audio context state:', this.audioContext.state);
      
      // Master compressor
      this.compressor = this.audioContext.createDynamicsCompressor();
      this.compressor.threshold.value = -15;
      this.compressor.knee.value = 6;
      this.compressor.ratio.value = 3;
      this.compressor.attack.value = 0.003;
      this.compressor.release.value = 0.25;
      
      // Master gain
      this.masterGain = this.audioContext.createGain();
      this.masterGain.gain.value = state.volume * 0.5;
      this.masterGain.connect(this.compressor);
      this.compressor.connect(this.audioContext.destination);
      
      // Create reverb
      await this.createReverb();
      
      // Create delay
      this.createDelay();
      
      this.isInitialized = true;
      console.log('Techno engine initialized successfully');
      console.log('Audio context state:', this.audioContext.state);
      
      // Test sound
      this.testSound();
    } catch (error) {
      console.error('Failed to initialize audio:', error);
      if (initAttempts < 5) {
        initAttempts++;
        setTimeout(() => this.init(), 1000);
      }
    }
  }

  testSound() {
    // Play a test beep to verify audio works
    try {
      if (!this.audioContext) return;
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();
      osc.type = 'sine';
      osc.frequency.value = 440;
      gain.gain.setValueAtTime(0.1, this.audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.1);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start();
      osc.stop(this.audioContext.currentTime + 0.1);
      console.log('Test sound played');
    } catch (e) {
      console.log('Test sound failed:', e);
    }
  }

  async createReverb() {
    try {
      if (!this.audioContext) return;
      
      const sampleRate = this.audioContext.sampleRate;
      const length = sampleRate * 3;
      const impulse = this.audioContext.createBuffer(2, length, sampleRate);
      
      for (let channel = 0; channel < 2; channel++) {
        const channelData = impulse.getChannelData(channel);
        for (let i = 0; i < length; i++) {
          const decay = Math.exp(-i / (sampleRate * 0.3));
          channelData[i] = (Math.random() * 2 - 1) * decay * 0.3;
        }
      }
      
      this.reverbNode = this.audioContext.createConvolver();
      this.reverbNode.buffer = impulse;
    } catch (e) {
      console.warn('Reverb creation failed:', e);
    }
  }

  createDelay() {
    if (!this.audioContext) return;
    this.delayNode = this.audioContext.createDelay(1.0);
    this.delayNode.delayTime.value = 0.3;
  }

  // Create Kick Drum
  createKick(time, velocity = 0.8) {
    if (!this.isInitialized || !this.audioContext || !this.masterGain) return;
    
    try {
      const now = this.audioContext.currentTime + time;
      
      // Oscillator for the kick body
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();
      const filter = this.audioContext.createBiquadFilter();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.1);
      
      filter.type = 'lowpass';
      filter.frequency.value = 200;
      
      gain.gain.setValueAtTime(velocity * 0.6 * state.volume * 0.5, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);
      
      osc.start(now);
      osc.stop(now + 0.2);
      
      // Click for attack
      const bufferSize = this.audioContext.sampleRate * 0.005;
      const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.1));
      }
      const noise = this.audioContext.createBufferSource();
      noise.buffer = buffer;
      const noiseGain = this.audioContext.createGain();
      const noiseFilter = this.audioContext.createBiquadFilter();
      noiseFilter.type = 'highpass';
      noiseFilter.frequency.value = 3000;
      
      noiseGain.gain.setValueAtTime(velocity * 0.1 * state.volume * 0.5, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.01);
      
      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(this.masterGain);
      
      noise.start(now);
      noise.stop(now + 0.02);
    } catch (e) {
      console.debug('Kick error:', e);
    }
  }

  // Create Bass
  createBass(note, time, velocity = 0.7) {
    if (!this.isInitialized || !this.audioContext || !this.masterGain) return;
    
    try {
      const now = this.audioContext.currentTime + time;
      const freq = NOTE_FREQUENCIES[note] || 55;
      
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();
      const filter = this.audioContext.createBiquadFilter();
      
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now);
      
      filter.type = 'lowpass';
      filter.frequency.value = 400;
      filter.Q.value = 2;
      
      gain.gain.setValueAtTime(velocity * 0.3 * state.volume * 0.5, now);
      gain.gain.exponentialRampToValueAtTime(velocity * 0.1 * state.volume * 0.5, now + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);
      
      osc.start(now);
      osc.stop(now + 0.5);
    } catch (e) {
      console.debug('Bass error:', e);
    }
  }

  // Create Hi-Hat
  createHiHat(time, velocity = 0.6) {
    if (!this.isInitialized || !this.audioContext || !this.masterGain) return;
    
    try {
      const now = this.audioContext.currentTime + time;
      
      const bufferSize = this.audioContext.sampleRate * 0.05;
      const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.05));
      }
      
      const noise = this.audioContext.createBufferSource();
      noise.buffer = buffer;
      
      const gain = this.audioContext.createGain();
      const filter = this.audioContext.createBiquadFilter();
      
      filter.type = 'bandpass';
      filter.frequency.value = 7000;
      filter.Q.value = 1.5;
      
      gain.gain.setValueAtTime(velocity * 0.15 * state.volume * 0.5, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);
      
      noise.start(now);
      noise.stop(now + 0.05);
    } catch (e) {
      console.debug('Hi-hat error:', e);
    }
  }

  // Create Clap
  createClap(time, velocity = 0.7) {
    if (!this.isInitialized || !this.audioContext || !this.masterGain) return;
    
    try {
      const now = this.audioContext.currentTime + time;
      
      const bufferSize = this.audioContext.sampleRate * 0.05;
      const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.2));
      }
      
      const noise = this.audioContext.createBufferSource();
      noise.buffer = buffer;
      
      const gain = this.audioContext.createGain();
      const filter = this.audioContext.createBiquadFilter();
      
      filter.type = 'bandpass';
      filter.frequency.value = 2000;
      filter.Q.value = 1;
      
      gain.gain.setValueAtTime(velocity * 0.2 * state.volume * 0.5, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);
      
      noise.start(now);
      noise.stop(now + 0.06);
    } catch (e) {
      console.debug('Clap error:', e);
    }
  }

  // Create Synth
  createSynth(note, time, velocity = 0.6) {
    if (!this.isInitialized || !this.audioContext || !this.masterGain) return;
    
    try {
      const now = this.audioContext.currentTime + time;
      const freq = NOTE_FREQUENCIES[note];
      if (!freq) return;
      
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();
      const filter = this.audioContext.createBiquadFilter();
      
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now);
      
      filter.type = 'lowpass';
      filter.frequency.value = 2000;
      filter.Q.value = 2;
      
      gain.gain.setValueAtTime(velocity * 0.15 * state.volume * 0.5, now);
      gain.gain.exponentialRampToValueAtTime(velocity * 0.05 * state.volume * 0.5, now + 0.5);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1);
      
      osc.connect(filter);
      filter.connect(gain);
      
      if (this.reverbNode) {
        const reverbGain = this.audioContext.createGain();
        reverbGain.gain.value = 0.5;
        gain.connect(reverbGain);
        reverbGain.connect(this.reverbNode);
        this.reverbNode.connect(this.masterGain);
      }
      gain.connect(this.masterGain);
      
      osc.start(now);
      osc.stop(now + 1.5);
    } catch (e) {
      console.debug('Synth error:', e);
    }
  }

  setVolume(value) {
    state.volume = value;
    if (this.masterGain) {
      this.masterGain.gain.value = value * 0.5;
    }
  }

  setBPM(bpm) {
    currentBPM = bpm;
    state.bpm = bpm;
  }

  setSubgenre(subgenre) {
    state.subgenre = subgenre;
  }

  dispose() {
    if (this.audioContext) {
      this.audioContext.close();
    }
    this.isInitialized = false;
  }
}

// Music Generator
class TechnoGenerator {
  constructor(engine) {
    this.engine = engine;
    this.isRunning = false;
    this.timeoutId = null;
    this.currentBar = 0;
    this.intervalId = null;
    this.beatCount = 0;
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    state.startTime = Date.now();
    state.noteCount = 0;
    console.log('Generator started');
    this.scheduleLoop();
  }

  stop() {
    this.isRunning = false;
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    console.log('Generator stopped');
  }

  scheduleLoop() {
    if (!this.isRunning || !this.engine.isInitialized) {
      if (!this.engine.isInitialized) {
        console.log('Engine not initialized, retrying...');
        setTimeout(() => this.scheduleLoop(), 500);
      }
      return;
    }
    
    const bpm = state.bpm || 128;
    const beatDuration = 60 / bpm;
    
    // Generate one bar (4 beats)
    const now = this.engine.audioContext.currentTime;
    this.generateBar(now + 0.1);
    
    // Schedule next bar
    this.timeoutId = setTimeout(() => {
      this.scheduleLoop();
    }, beatDuration * 4000 + 50);
  }

  generateBar(startTime) {
    const bpm = state.bpm || 128;
    const beatDuration = 60 / bpm;
    const subgenre = state.subgenre;
    const density = PRESETS[state.preset]?.density || 0.7;
    
    // Kick - 4x4 pattern
    for (let beat = 0; beat < 4; beat++) {
      const time = startTime + beat * beatDuration;
      this.engine.createKick(time, 0.7 + Math.random() * 0.2);
    }
    
    // Hi-hats - offbeat
    for (let i = 0; i < 8; i++) {
      const time = startTime + i * beatDuration / 2;
      if (i % 2 === 1 && Math.random() < 0.8) {
        this.engine.createHiHat(time, 0.3 + Math.random() * 0.3);
      }
      // Add some extra hi-hats
      if (Math.random() < 0.3) {
        this.engine.createHiHat(time + beatDuration / 4, 0.2 + Math.random() * 0.2);
      }
    }
    
    // Clap on 2 and 4
    if (Math.random() < 0.9) {
      this.engine.createClap(startTime + beatDuration * 1, 0.5 + Math.random() * 0.2);
      this.engine.createClap(startTime + beatDuration * 3, 0.5 + Math.random() * 0.2);
    }
    
    // Bass - every other beat
    const bassNotes = ['C2', 'G2', 'E2', 'A2'];
    for (let i = 0; i < 4; i++) {
      if (i % 2 === 0 && Math.random() < 0.7) {
        const note = bassNotes[i % bassNotes.length];
        const time = startTime + i * beatDuration;
        this.engine.createBass(note, time, 0.5 + Math.random() * 0.3);
      }
      // Add some offbeat bass
      if (Math.random() < 0.2) {
        const note = bassNotes[(i + 1) % bassNotes.length];
        const time = startTime + i * beatDuration + beatDuration / 2;
        this.engine.createBass(note, time, 0.3 + Math.random() * 0.2);
      }
    }
    
    // Synth - occasional
    if (this.currentBar % 2 === 0 && Math.random() < 0.5) {
      const synthNotes = ['C4', 'E4', 'G4', 'A4'];
      const note = synthNotes[Math.floor(Math.random() * synthNotes.length)];
      const time = startTime + beatDuration * 1.5;
      this.engine.createSynth(note, time, 0.3 + Math.random() * 0.2);
    }
    
    // Extra percussion
    if (density > 0.7) {
      for (let i = 0; i < 2; i++) {
        const time = startTime + Math.random() * beatDuration * 4;
        if (Math.random() < 0.3) {
          this.engine.createClap(time, 0.2 + Math.random() * 0.2);
        }
      }
    }
    
    state.noteCount += 10 + Math.floor(Math.random() * 5);
    this.currentBar++;
    
    // Update status
    this.updateStatus();
  }

  updateStatus() {
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
}

// Initialize
let technoEngine = new TechnoEngine();

// Message handler
chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  console.log('Message received:', message.action);
  
  if (message.action === 'ping') {
    sendResponse({ success: true });
    return true;
  }
  
  if (message.action === 'startTechno') {
    console.log('Starting techno...');
    
    if (!technoEngine.isInitialized) {
      await technoEngine.init();
    }
    
    if (message.preset) {
      state.preset = message.preset;
      const preset = PRESETS[message.preset];
      if (preset) {
        if (preset.bpm) state.bpm = preset.bpm;
        if (preset.subgenre) state.subgenre = preset.subgenre;
      }
    }
    if (message.bpm) state.bpm = message.bpm;
    if (message.subgenre) state.subgenre = message.subgenre;
    if (message.volume !== undefined) technoEngine.setVolume(message.volume);
    
    technoEngine.setBPM(state.bpm);
    technoEngine.setSubgenre(state.subgenre);
    
    if (!musicGenerator) {
      musicGenerator = new TechnoGenerator(technoEngine);
    }
    
    // Resume audio context
    if (technoEngine.audioContext && technoEngine.audioContext.state === 'suspended') {
      await technoEngine.audioContext.resume();
    }
    
    musicGenerator.start();
    isPlaying = true;
    console.log('Techno started successfully');
    sendResponse({ success: true });
    return true;
  }
  
  if (message.action === 'stopTechno') {
    console.log('Stopping techno...');
    if (musicGenerator) {
      musicGenerator.stop();
    }
    isPlaying = false;
    sendResponse({ success: true });
    return true;
  }
  
  if (message.action === 'updateVolume') {
    if (technoEngine) {
      technoEngine.setVolume(message.volume);
    }
    sendResponse({ success: true });
    return true;
  }
  
  if (message.action === 'updateBPM') {
    state.bpm = message.bpm;
    if (technoEngine) {
      technoEngine.setBPM(message.bpm);
    }
    sendResponse({ success: true });
    return true;
  }
  
  if (message.action === 'updateSubgenre') {
    state.subgenre = message.subgenre;
    if (technoEngine) {
      technoEngine.setSubgenre(message.subgenre);
    }
    sendResponse({ success: true });
    return true;
  }
  
  if (message.action === 'updatePreset') {
    state.preset = message.preset;
    const preset = PRESETS[message.preset];
    if (preset) {
      if (preset.bpm) {
        state.bpm = preset.bpm;
        if (technoEngine) technoEngine.setBPM(preset.bpm);
      }
      if (preset.subgenre) {
        state.subgenre = preset.subgenre;
        if (technoEngine) technoEngine.setSubgenre(preset.subgenre);
      }
    }
    sendResponse({ success: true });
    return true;
  }
});

console.log('Offscreen techno engine ready');
