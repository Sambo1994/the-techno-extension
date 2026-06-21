let offscreenDocument = null;
let isPlaying = false;
let isStarting = false;

async function createOffscreenDocument() {
  if (offscreenDocument) {
    try {
      await chrome.runtime.sendMessage({ action: 'ping' });
      return;
    } catch (e) {
      offscreenDocument = null;
    }
  }
  
  try {
    await chrome.offscreen.createDocument({
      url: 'offscreen.html',
      reasons: ['AUDIO_PLAYBACK'],
      justification: 'Play techno music'
    });
    offscreenDocument = true;
    console.log('Offscreen document created');
    await new Promise(resolve => setTimeout(resolve, 500));
  } catch (error) {
    console.error('Failed to create offscreen document:', error);
  }
}

async function closeOffscreenDocument() {
  if (!offscreenDocument) return;
  try {
    await chrome.offscreen.closeDocument();
    offscreenDocument = null;
    console.log('Offscreen document closed');
  } catch (error) {
    console.error('Failed to close offscreen document:', error);
  }
}

// Track if we're already starting to prevent duplicate starts
let startInProgress = false;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'startAudio') {
    // Prevent duplicate starts
    if (startInProgress) {
      sendResponse({ success: false, error: 'Already starting' });
      return true;
    }
    
    startInProgress = true;
    
    createOffscreenDocument().then(async () => {
      try {
        // First, stop any existing audio
        try {
          await chrome.runtime.sendMessage({ action: 'stopTechno' });
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (e) {}
        
        // Then start new audio
        await chrome.runtime.sendMessage({
          action: 'startTechno',
          preset: message.preset || 'club',
          volume: message.volume || 0.7,
          bpm: message.bpm || 128
        });
        isPlaying = true;
        startInProgress = false;
        sendResponse({ success: true });
      } catch (e) {
        startInProgress = false;
        sendResponse({ success: false });
      }
    });
    return true;
  }
  
  if (message.action === 'stopAudio') {
    chrome.runtime.sendMessage({ action: 'stopTechno' });
    isPlaying = false;
    // Don't close immediately, let it finish
    setTimeout(() => {
      if (!isPlaying) {
        closeOffscreenDocument();
      }
    }, 2000);
    sendResponse({ success: true });
    return true;
  }
  
  if (message.action === 'updateVolume') {
    chrome.runtime.sendMessage({ action: 'updateVolume', volume: message.volume });
    sendResponse({ success: true });
    return true;
  }
  
  if (message.action === 'updateBPM') {
    chrome.runtime.sendMessage({ action: 'updateBPM', bpm: message.bpm });
    sendResponse({ success: true });
    return true;
  }
  
  if (message.action === 'updatePreset') {
    chrome.runtime.sendMessage({ action: 'updatePreset', preset: message.preset });
    sendResponse({ success: true });
    return true;
  }
  
  if (message.action === 'getStatus') {
    sendResponse({ isPlaying });
    return true;
  }
});

chrome.runtime.onInstalled.addListener(() => {
  console.log('The Techno installed');
});
