// Complete Techno Engine - Fixed Continuous Playback
console.log('Offscreen script loaded');

let audioContext = null;
let isPlaying = false;
let masterGain = null;
let isInitialized = false;
let currentBPM = 128;
let musicGenerator = null;
let initAttempts = 0;
let scheduledTime = 0;
let beatCount = 0;
let isScheduling = false;

// Preset configurations
const PRESETS = {
  club: { bpm: 128, subgenre: 'deep', density: 0.8, complexity: 4, description: 'Club' },
  warehouse: { bpm: 135, subgenre: 'industrial', density: 0.9, complexity: 5, description: 'Warehouse' },
  chillout: { bpm: 115, subgenre: 'deep', density: 0.5, complexity: 3, description: 'Chillout' },
  progressive: { bpm: 125, subgenre: 'melodic', density: 0.7, complexity: 4, description: 'Progressive' },
  techno: { bpm: 140, subgenre: 'industrial', density: 0.9, complexity: 5, description: 'Hard Techno' }
};

const NOTE_FREQUENCIES = {
  'C2': 65.41, 'D2': 73.42, 'E2': 82.41, 'F2': 87.31, 'G2': 98.00, 'A2': 110.00, 'B2': 123.47,
  'C3': 130.81, 'D3': 146.83, 'E3': 164.81, 'F3': 174.61, 'G3': 196.00, 'A3': 220.00, 'B3': 246.94,
  'C4': 261.63, 'D4': 293.66, 'E4': 329.63, 'F4': 349.23, 'G4': 392.00, 'A4': 440.00, 'B4': 493.88,
  'C5': 523.25, 'D5': 587.33, 'E5': 659.25, 'F5': 698.46, 'G5': 783.99, 'A5': 880.00, 'B5': 987.77
};

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
    this.isInitialized = false;
  }

  async init() {
    if (this.isInitialized && this.audioContext && this.audioContext.state === 'running') {
      return;
    }
    
    try {
      console.log('Initializing audio context...');
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }
      
      console.log('Audio context state:', this.audioContext.state);
      
      this.masterGain = this.audioContext.createGain();
      this.masterGain.gain.value = state.volume * 0.3;
      this.masterGain.connect(this.audioContext.destination);
      
      this.isInitialized = true;
      console.log('Techno engine initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize audio:', error);
      if (initAttempts < 5) {
        initAttempts++;
        setTimeout(() => this.init(), 1000);
      }
      return false;
    }
  }

  createKick(time, velocity = 0.8) {
    if (!this.isInitialized || !this.audioContext || !this.masterGain) return;
    
    try {
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(120, time);
      osc.frequency.exponentialRampToValueAtTime(30, time + 0.12);
      
      gain.gain.setValueAtTime(velocity * 0.5 * state.volume * 0.3, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);
      
      osc.connect(gain);
      gain.connect(this.masterGain);
      
      osc.start(time);
      osc.stop(time + 0.2);
    } catch (e) {
      console.debug('Kick error:', e);
    }
  }

  createHiHat(time, velocity = 0.6) {
    if (!this.isInitialized || !this.audioContext || !this.masterGain) return;
    
    try {
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
      
      gain.gain.setValueAtTime(velocity * 0.15 * state.volume * 0.3, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);
      
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);
      
      noise.start(time);
      noise.stop(time + 0.05);
    } catch (e) {
      console.debug('Hi-hat error:', e);
    }
  }

  createClap(time, velocity = 0.7) {
    if (!this.isInitialized || !this.audioContext || !this.masterGain) return;
    
    try {
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
      
      gain.gain.setValueAtTime(velocity * 0.2 * state.volume * 0.3, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
      
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);
      
      noise.start(time);
      noise.stop(time + 0.06);
    } catch (e) {
      console.debug('Clap error:', e);
    }
  }

  createBass(note, time, velocity = 0.7) {
    if (!this.isInitialized || !this.audioContext || !this.masterGain) return;
    
    try {
      const freq = NOTE_FREQUENCIES[note] || 55;
      
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();
      const filter = this.audioContext.createBiquadFilter();
      
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, time);
      
      filter.type = 'lowpass';
      filter.frequency.value = 300;
      filter.Q.value = 2;
      
      gain.gain.setValueAtTime(velocity * 0.25 * state.volume * 0.3, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.3);
      
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);
      
      osc.start(time);
      osc.stop(time + 0.4);
    } catch (e) {
      console.debug('Bass error:', e);
    }
  }

  createSynth(note, time, velocity = 0.6) {
    if (!this.isInitialized || !this.audioContext || !this.masterGain) return;
    
    try {
      const freq = NOTE_FREQUENCIES[note];
      if (!freq) return;
      
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();
      
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, time);
      
      gain.gain.setValueAtTime(velocity * 0.12 * state.volume * 0.3, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 1);
      
      osc.connect(gain);
      gain.connect(this.masterGain);
      
      osc.start(time);
      osc.stop(time + 1.2);
    } catch (e) {
      console.debug('Synth error:', e);
    }
  }

  setVolume(value) {
    state.volume = value;
    if (this.masterGain) {
      this.masterGain.gain.value = value * 0.3;
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

// Music Generator - FIXED CONTINUOUS PLAYBACK
class TechnoGenerator {
  constructor(engine) {
    this.engine = engine;
    this.isRunning = false;
    this.beatCount = 0;
    this.nextBeatTime = 0;
    this.animationId = null;
    this.barCount = 0;
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    state.startTime = Date.now();
    state.noteCount = 0;
    this.beatCount = 0;
    this.barCount = 0;
    
    // Start scheduling
    this.nextBeatTime = this.engine.audioContext.currentTime;
    console.log('Generator started');
    this.scheduleNextBeat();
  }

  stop() {
    this.isRunning = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    console.log('Generator stopped');
  }

  scheduleNextBeat() {
    if (!this.isRunning || !this.engine.isInitialized) {
      if (!this.engine.isInitialized) {
        setTimeout(() => this.scheduleNextBeat(), 100);
      }
      return;
    }
    
    const bpm = state.bpm || 128;
    const beatDuration = 60 / bpm;
    const lookahead = 0.1;
    
    // Schedule beats in advance
    while (this.nextBeatTime < this.engine.audioContext.currentTime + lookahead) {
      this.generateBeat(this.nextBeatTime);
      this.nextBeatTime += beatDuration;
    }
    
    // Schedule next check
    this.animationId = requestAnimationFrame(() => {
      this.scheduleNextBeat();
    });
  }

  generateBeat(time) {
    const beat = this.beatCount % 16; // 4 bars of 4 beats
    const bpm = state.bpm || 128;
    const beatDuration = 60 / bpm;
    
    // KICK - on every beat (4x4)
    this.engine.createKick(time, 0.7 + Math.random() * 0.2);
    
    // HI-HAT - offbeat and variations
    if (beat % 2 === 1) {
      this.engine.createHiHat(time, 0.3 + Math.random() * 0.2);
    }
    // Extra hi-hats for variety
    if (beat % 4 === 0 && Math.random() < 0.5) {
      this.engine.createHiHat(time + beatDuration * 0.25, 0.2 + Math.random() * 0.2);
    }
    if (beat % 4 === 2 && Math.random() < 0.5) {
      this.engine.createHiHat(time + beatDuration * 0.75, 0.2 + Math.random() * 0.2);
    }
    
    // CLAP - on 2 and 4 (beats 1 and 3 in 0-indexed)
    if (beat === 1 || beat === 3) {
      this.engine.createClap(time, 0.5 + Math.random() * 0.2);
    }
    // Extra claps
    if (beat === 7 || beat === 11) {
      this.engine.createClap(time, 0.3 + Math.random() * 0.2);
    }
    
    // BASS - on every other beat with variation
    const bassNotes = ['C2', 'G2', 'E2', 'A2'];
    if (beat % 2 === 0) {
      const note = bassNotes[Math.floor(Math.random() * bassNotes.length)];
      this.engine.createBass(note, time, 0.5 + Math.random() * 0.3);
    }
    // Offbeat bass
    if (beat % 4 === 1 && Math.random() < 0.3) {
      const note = bassNotes[Math.floor(Math.random() * bassNotes.length)];
      this.engine.createBass(note, time + beatDuration * 0.5, 0.3 + Math.random() * 0.2);
    }
    
    // SYNTH - occasional chords/melody
    if (this.barCount % 2 === 0) {
      if (beat === 2 || beat === 6 || beat === 10 || beat === 14) {
        const synthNotes = ['C4', 'E4', 'G4', 'A4', 'B4'];
        const note = synthNotes[Math.floor(Math.random() * synthNotes.length)];
        this.engine.createSynth(note, time, 0.2 + Math.random() * 0.2);
      }
    }
    
    // Extra percussion
    if (Math.random() < 0.1 && beat % 4 === 0) {
      this.engine.createClap(time + beatDuration * 0.5, 0.2 + Math.random() * 0.1);
    }
    
    // Update counters
    this.beatCount++;
    if (this.beatCount % 4 === 0) {
      this.barCount++;
    }
    
    // Update note count
    state.noteCount += 3 + Math.floor(Math.random() * 2);
    
    // Update status periodically
    if (this.beatCount % 4 === 0) {
      this.updateStatus();
    }
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
let musicGenerator = null;

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
      const success = await technoEngine.init();
      if (!success) {
        sendResponse({ success: false, error: 'Failed to initialize audio' });
        return true;
      }
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
