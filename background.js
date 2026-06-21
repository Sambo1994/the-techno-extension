// Background service worker for The Techno
let offscreenDocument = null;
let isPlaying = false;
let offscreenReady = false;

// Create offscreen document for background audio
async function createOffscreenDocument() {
  if (offscreenDocument) {
    // Check if it's still alive
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
      justification: 'Play techno music in background'
    });
    offscreenDocument = true;
    console.log('Offscreen document created');
    
    // Wait for it to be ready
    await new Promise(resolve => setTimeout(resolve, 500));
  } catch (error) {
    console.error('Failed to create offscreen document:', error);
  }
}

// Close offscreen document
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

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'startAudio') {
    createOffscreenDocument().then(async () => {
      // Send multiple times to ensure it gets through
      for (let i = 0; i < 3; i++) {
        try {
          await chrome.runtime.sendMessage({
            action: 'startTechno',
            preset: message.preset || 'club',
            volume: message.volume || 0.7,
            bpm: message.bpm || 128,
            subgenre: message.subgenre || 'deep'
          });
          break;
        } catch (e) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      isPlaying = true;
      sendResponse({ success: true });
    });
    return true;
  }
  
  if (message.action === 'stopAudio') {
    chrome.runtime.sendMessage({ action: 'stopTechno' });
    isPlaying = false;
    setTimeout(() => {
      if (!isPlaying) {
        closeOffscreenDocument();
      }
    }, 3000);
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
  
  if (message.action === 'updateSubgenre') {
    chrome.runtime.sendMessage({ action: 'updateSubgenre', subgenre: message.subgenre });
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
