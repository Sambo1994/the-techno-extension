// At the top of the file
let audioContext = null;
let isPlaying = false;
let generator = null;
let masterGain = null;
let compressor = null;
let isInitialized = false;
let currentBPM = 128;

// Fixed TechnoEngine class
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
    if (this.isInitialized) {
      if (this.audioContext && this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }
      return;
    }
    
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
      setTimeout(() => this.init(), 1000);
    }
  }

  createKick(time, velocity = 0.8) {
    if (!this.isInitialized || !this.audioContext || !this.masterGain) {
      console.warn('Audio not ready');
      return;
    }
    
    try {
      const now = this.audioContext.currentTime + time;
      // ... rest of the method
    } catch (e) {
      console.debug('Kick error:', e);
    }
  }

  // ... all other methods with similar checks
}

// Fixed TechnoGenerator class
class TechnoGenerator {
  constructor(engine) {
    this.engine = engine;
    this.isRunning = false;
    this.timeoutId = null;
    this.currentBar = 0;
    this.intervalId = null;
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    state.startTime = Date.now();
    this.scheduleLoop();
  }

  scheduleLoop() {
    if (!this.isRunning || !this.engine.audioContext) {
      return;
    }
    
    const bpm = state.bpm || 128;
    const beatDuration = 60 / bpm;
    const now = this.engine.audioContext.currentTime;
    
    this.generateBar(now + 0.1, this.currentBar);
    this.currentBar++;
    
    this.timeoutId = setTimeout(() => {
      this.scheduleLoop();
    }, beatDuration * 4000 + 50);
  }

  // ... rest of the methods
}
