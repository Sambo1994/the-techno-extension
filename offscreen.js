// Techno Music Engine - Generative Electronic Music
// Creates: Kick, Bass, Synth, Hi-Hat, Clap, Percussion, FX

let audioContext = null;
let isPlaying = false;
let generator = null;
let masterGain = null;
let compressor = null;
let isInitialized = false;
let currentBPM = 128;
let scheduledEvents = [];

// Preset configurations
const PRESETS = {
  club: {
    bpm: 128,
    subgenre: 'deep',
    density: 0.8,
    complexity: 4,
    description: 'Club',
    style: 'driving'
  },
  warehouse: {
    bpm: 135,
    subgenre: 'industrial',
    density: 0.9,
    complexity: 5,
    description: 'Warehouse',
    style: 'heavy'
  },
  chillout: {
    bpm: 115,
    subgenre: 'deep',
    density: 0.5,
    complexity: 3,
    description: 'Chillout',
    style: 'ambient'
  },
  progressive: {
    bpm: 125,
    subgenre: 'melodic',
    density: 0.7,
    complexity: 4,
    description: 'Progressive',
    style: 'building'
  },
  techno: {
    bpm: 140,
    subgenre: 'industrial',
    density: 0.9,
    complexity: 5,
    description: 'Hard Techno',
    style: 'intense'
  }
};

// Subgenre patterns
const SUBGENRES = {
  deep: {
    kickPattern: '4x4',
    hihatPattern: 'offbeat',
    synthStyle: 'pad',
    bassStyle: 'sub',
    reverbAmount: 0.5,
    delayAmount: 0.3
  },
  industrial: {
    kickPattern: '4x4',
    hihatPattern: 'complex',
    synthStyle: 'distorted',
    bassStyle: 'distorted',
    reverbAmount: 0.7,
    delayAmount: 0.5
  },
  melodic: {
    kickPattern: '4x4',
    hihatPattern: 'groove',
    synthStyle: 'melodic',
    bassStyle: 'saw',
    reverbAmount: 0.4,
    delayAmount: 0.4
  },
  minimal: {
    kickPattern: '4x4',
    hihatPattern: 'sparse',
    synthStyle: 'drone',
    bassStyle: 'sub',
    reverbAmount: 0.6,
    delayAmount: 0.2
  }
};

// Note frequencies (C minor scale for techno)
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
  startTime: Date.now(),
  currentPattern: 0
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
    this.oscillators = [];
    this.analyzers = [];
  }

  async init() {
    if (this.isInitialized) return;
    
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // Master compressor
      this.compressor = this.audioContext.createDynamicsCompressor();
      this.compressor.threshold.value = -20;
      this.compressor.knee.value = 6;
      this.compressor.ratio.value = 4;
      this.compressor.attack.value = 0.003;
      this.compressor.release.value = 0.25;
      
      // Master gain
      this.masterGain = this.audioContext.createGain();
      this.masterGain.gain.value = state.volume;
      this.masterGain.connect(this.compressor);
      this.compressor.connect(this.audioContext.destination);
      
      // Reverb
      await this.createReverb();
      
      // Delay
      this.createDelay();
      
      this.isInitialized = true;
      console.log('Techno engine initialized');
    } catch (error) {
      console.error('Failed to initialize audio:', error);
    }
  }

  async createReverb() {
    try {
      const sampleRate = this.audioContext.sampleRate;
      const length = sampleRate * 4;
      const impulse = this.audioContext.createBuffer(2, length, sampleRate);
      
      for (let channel = 0; channel < 2; channel++) {
        const channelData = impulse.getChannelData(channel);
        for (let i = 0; i < length; i++) {
          const decay = Math.exp(-i / (sampleRate * (0.3 + state.subgenre === 'industrial' ? 0.4 : 0.2)));
          channelData[i] = (Math.random() * 2 - 1) * decay * 0.4;
        }
      }
      
      this.reverbNode = this.audioContext.createConvolver();
      this.reverbNode.buffer = impulse;
      this.reverbNode.connect(this.masterGain);
    } catch (e) {
      console.warn('Reverb creation failed:', e);
    }
  }

  createDelay() {
    this.delayNode = this.audioContext.createDelay(1.0);
    this.delayNode.delayTime.value = 0.3;
    const feedback = this.audioContext.createGain();
    feedback.gain.value = 0.3;
    this.delayNode.connect(feedback);
    feedback.connect(this.delayNode);
  }

  // Create Kick Drum
  createKick(time, velocity = 0.8) {
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
    
    gain.gain.setValueAtTime(velocity * 0.8 * state.volume, now);
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
    
    noiseGain.gain.setValueAtTime(velocity * 0.15 * state.volume, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.01);
    
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.masterGain);
    
    noise.start(now);
    noise.stop(now + 0.02);
  }

  // Create Bass
  createBass(note, time, velocity = 0.7) {
    const now = this.audioContext.currentTime + time;
    const freq = NOTE_FREQUENCIES[note] || 55;
    const subgenre = state.subgenre;
    
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    const filter = this.audioContext.createBiquadFilter();
    
    osc.type = subgenre === 'distorted' ? 'sawtooth' : 'sine';
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(freq * (1 + (Math.random() - 0.5) * 0.02), now + 0.05);
    
    filter.type = 'lowpass';
    filter.frequency.value = subgenre === 'distorted' ? 800 : 300;
    filter.Q.value = subgenre === 'distorted' ? 2 : 1;
    
    gain.gain.setValueAtTime(velocity * 0.4 * state.volume, now);
    gain.gain.exponentialRampToValueAtTime(velocity * 0.2 * state.volume, now + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    
    if (subgenre === 'distorted') {
      // Add distortion
      const distGain = this.audioContext.createGain();
      distGain.gain.value = 2;
      gain.connect(distGain);
      distGain.connect(this.masterGain);
    }
    
    osc.start(now);
    osc.stop(now + 0.6);
  }

  // Create Hi-Hat
  createHiHat(time, velocity = 0.6, type = 'closed') {
    const now = this.audioContext.currentTime + time;
    const duration = type === 'open' ? 0.15 : 0.04;
    
    const bufferSize = this.audioContext.sampleRate * 0.2;
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * (type === 'open' ? 0.3 : 0.05)));
    }
    
    const noise = this.audioContext.createBufferSource();
    noise.buffer = buffer;
    
    const gain = this.audioContext.createGain();
    const filter = this.audioContext.createBiquadFilter();
    
    filter.type = 'bandpass';
    filter.frequency.value = type === 'open' ? 4000 : 7000;
    filter.Q.value = 1.5;
    
    gain.gain.setValueAtTime(velocity * 0.2 * state.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    
    noise.start(now);
    noise.stop(now + duration + 0.01);
  }

  // Create Clap / Snare
  createClap(time, velocity = 0.7) {
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
    
    gain.gain.setValueAtTime(velocity * 0.3 * state.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    
    noise.start(now);
    noise.stop(now + 0.06);
  }

  // Create Synth Pad
  createSynthPad(chord, time, velocity = 0.6) {
    const now = this.audioContext.currentTime + time;
    const subgenre = state.subgenre;
    
    chord.forEach((note, index) => {
      const freq = NOTE_FREQUENCIES[note];
      if (!freq) return;
      
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();
      const filter = this.audioContext.createBiquadFilter();
      
      osc.type = subgenre === 'distorted' ? 'sawtooth' : subgenre === 'melodic' ? 'square' : 'sine';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * (1 + (Math.random() - 0.5) * 0.01), now + 0.5);
      
      filter.type = 'lowpass';
      filter.frequency.value = subgenre === 'distorted' ? 1500 : 3000;
      filter.Q.value = 2;
      
      const attack = index * 0.02;
      gain.gain.setValueAtTime(0.001, now + attack);
      gain.gain.exponentialRampToValueAtTime(velocity * 0.15 * state.volume, now + attack + 0.1);
      gain.gain.exponentialRampToValueAtTime(velocity * 0.08 * state.volume, now + attack + 0.5);
      gain.gain.exponentialRampToValueAtTime(0.001, now + attack + 2);
      
      osc.connect(filter);
      filter.connect(gain);
      
      if (this.reverbNode) {
        const reverbGain = this.audioContext.createGain();
        reverbGain.gain.value = 0.5;
        gain.connect(reverbGain);
        reverbGain.connect(this.reverbNode);
      }
      
      gain.connect(this.masterGain);
      
      osc.start(now + attack);
      osc.stop(now + attack + 2.5);
    });
  }

  // Create Lead Synth
  createLeadNote(note, time, velocity = 0.6) {
    const now = this.audioContext.currentTime + time;
    const freq = NOTE_FREQUENCIES[note];
    if (!freq) return;
    
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    const filter = this.audioContext.createBiquadFilter();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.02, now + 0.05);
    
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(3000, now);
    filter.frequency.exponentialRampToValueAtTime(1500, now + 0.3);
    filter.Q.value = 3;
    
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(velocity * 0.2 * state.volume, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(velocity * 0.1 * state.volume, now + 0.2);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    
    osc.connect(filter);
    filter.connect(gain);
    
    if (this.delayNode) {
      gain.connect(this.delayNode);
      this.delayNode.connect(this.masterGain);
    }
    gain.connect(this.masterGain);
    
    osc.start(now);
    osc.stop(now + 0.8);
  }

  setVolume(value) {
    state.volume = value;
    if (this.masterGain) {
      this.masterGain.gain.value = value;
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
    this.currentBeat = 0;
    this.intervalId = null;
    this.chordProgression = [
      ['C3', 'E3', 'G3', 'B3'],
      ['D3', 'F3', 'A3', 'C4'],
      ['E3', 'G3', 'B3', 'D4'],
      ['A3', 'C4', 'E4', 'G4']
    ];
    this.bassPattern = ['C2', 'G2', 'E2', 'A2'];
    this.leadPattern = ['C4', 'E4', 'G4', 'A4', 'G4', 'E4', 'D4', 'C4'];
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    state.startTime = Date.now();
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
  }

  scheduleLoop() {
    if (!this.isRunning) return;
    
    const bpm = state.bpm || 128;
    const beatDuration = 60 / bpm;
    const barDuration = beatDuration * 4;
    
    // Schedule a bar
    const now = this.audioContext.currentTime;
    const barStart = now + 0.1;
    
    this.generateBar(barStart, this.currentBar);
    this.currentBar++;
    
    // Schedule next bar
    this.timeoutId = setTimeout(() => {
      this.scheduleLoop();
    }, barDuration * 1000 + 50);
    
    // Update status
    this.updateStatus();
  }

  generateBar(startTime, barNumber) {
    const bpm = state.bpm || 128;
    const beatDuration = 60 / bpm;
    const subgenre = state.subgenre;
    const density = PRESETS[state.preset]?.density || 0.7;
    const complexity = PRESETS[state.preset]?.complexity || 3;
    
    // Kick pattern - 4x4
    for (let beat = 0; beat < 4; beat++) {
      const time = startTime + beat * beatDuration;
      this.engine.createKick(time, 0.8 + Math.random() * 0.2);
    }
    
    // Hi-hats
    if (subgenre === 'industrial' || subgenre === 'minimal') {
      // Complex hi-hat pattern
      for (let i = 0; i < 8; i++) {
        const time = startTime + i * beatDuration / 2;
        if (Math.random() < 0.7) {
          const isOpen = i % 4 === 0 && Math.random() < 0.3;
          this.engine.createHiHat(time, 0.4 + Math.random() * 0.3, isOpen ? 'open' : 'closed');
        }
      }
    } else {
      // Offbeat hi-hats
      for (let i = 0; i < 8; i++) {
        const time = startTime + i * beatDuration / 2;
        if (i % 2 === 1 && Math.random() < 0.8) {
          this.engine.createHiHat(time, 0.4 + Math.random() * 0.3);
        }
      }
    }
    
    // Clap on 2 and 4
    if (Math.random() < 0.8) {
      this.engine.createClap(startTime + beatDuration * 1, 0.6 + Math.random() * 0.2);
      this.engine.createClap(startTime + beatDuration * 3, 0.6 + Math.random() * 0.2);
    }
    
    // Bass
    const bassPattern = this.getBassPattern(barNumber);
    bassPattern.forEach((note, index) => {
      const time = startTime + index * (beatDuration / 2);
      if (Math.random() < 0.7) {
        this.engine.createBass(note, time, 0.6 + Math.random() * 0.3);
      }
    });
    
    // Synth chords
    if (barNumber % 2 === 0 && Math.random() < 0.6) {
      const chord = this.getChord(barNumber);
      this.engine.createSynthPad(chord, startTime + beatDuration * 1.5, 0.4 + Math.random() * 0.2);
    }
    
    // Lead melody
    if (complexity > 3 && Math.random() < 0.5) {
      const leadNotes = this.getLeadPattern(barNumber);
      leadNotes.forEach((note, index) => {
        const time = startTime + index * (beatDuration / 4);
        if (Math.random() < 0.4) {
          this.engine.createLeadNote(note, time, 0.3 + Math.random() * 0.3);
        }
      });
    }
    
    // Extra percussion
    if (density > 0.7) {
      for (let i = 0; i < 4; i++) {
        const time = startTime + Math.random() * beatDuration * 4;
        if (Math.random() < 0.2) {
          this.engine.createClap(time, 0.3 + Math.random() * 0.2);
        }
      }
    }
    
    state.noteCount += 20 + Math.floor(Math.random() * 10);
  }

  getBassPattern(barNumber) {
    const subgenre = state.subgenre;
    const pattern = ['C2', 'G2', 'E2', 'A2'];
    
    if (subgenre === 'industrial') {
      return ['C2', 'C2', 'G2', 'G2', 'E2', 'E2', 'A2', 'A2'];
    } else if (subgenre === 'melodic') {
      return ['C2', 'E2', 'G2', 'A2', 'G2', 'E2', 'D2', 'C2'];
    } else if (subgenre === 'minimal') {
      return ['C2', 'C2', 'C2', 'G2', 'C2', 'C2', 'C2', 'G2'];
    }
    return pattern;
  }

  getChord(barNumber) {
    const progressions = [
      ['C3', 'E3', 'G3', 'B3'],
      ['D3', 'F3', 'A3', 'C4'],
      ['E3', 'G3', 'B3', 'D4'],
      ['A3', 'C4', 'E4', 'G4']
    ];
    return progressions[barNumber % progressions.length];
  }

  getLeadPattern(barNumber) {
    const patterns = [
      ['C4', 'E4', 'G4', 'A4'],
      ['D4', 'F4', 'A4', 'C5'],
      ['E4', 'G4', 'B4', 'D5'],
      ['A4', 'C5', 'E5', 'G5']
    ];
    const base = patterns[barNumber % patterns.length];
    const pattern = [];
    for (let i = 0; i < 8; i++) {
      pattern.push(base[i % base.length]);
    }
    return pattern;
  }

  updateStatus() {
    const elapsed = (Date.now() - state.startTime) / 1000;
    const minutes = Math.floor(elapsed / 60);
    const seconds = Math.floor(elapsed % 60);
    
    // Send status update to popup if open
    chrome.runtime.sendMessage({
      action: 'statusUpdate',
      time: `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`,
      notes: state.noteCount
    }).catch(() => {});
  }
}

// Initialize
let technoEngine = new TechnoEngine();
let musicGenerator = null;

chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  if (message.action === 'startTechno') {
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
    
    if (technoEngine.audioContext && technoEngine.audioContext.state === 'suspended') {
      await technoEngine.audioContext.resume();
    }
    
    musicGenerator.start();
    isPlaying = true;
    sendResponse({ success: true });
    return true;
  }
  
  if (message.action === 'stopTechno') {
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
