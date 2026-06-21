// Background service worker for The Techno
let offscreenDocument = null;
let isPlaying = false;

async function createOffscreenDocument() {
  if (offscreenDocument) return;
  
  try {
    await chrome.offscreen.createDocument({
      url: 'offscreen.html',
      reasons: ['AUDIO_PLAYBACK'],
      justification: 'Play techno music in background'
    });
    offscreenDocument = true;
    console.log('Offscreen document created');
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

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'startAudio') {
    createOffscreenDocument().then(() => {
      chrome.runtime.sendMessage({
        action: 'startTechno',
        preset: message.preset || 'club',
        volume: message.volume || 0.7,
        bpm: message.bpm || 128,
        subgenre: message.subgenre || 'deep'
      });
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

chrome.action.onClicked.addListener(() => {});
