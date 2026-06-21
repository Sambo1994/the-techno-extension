let offscreenDocument = null;
let isPlaying = false;

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

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'startAudio') {
    createOffscreenDocument().then(async () => {
      try {
        await chrome.runtime.sendMessage({
          action: 'startTechno',
          preset: message.preset || 'club',
          volume: message.volume || 0.7,
          bpm: message.bpm || 128
        });
        isPlaying = true;
        sendResponse({ success: true });
      } catch (e) {
        sendResponse({ success: false });
      }
    });
    return true;
  }
  
  if (message.action === 'stopAudio') {
    chrome.runtime.sendMessage({ action: 'stopTechno' });
    isPlaying = false;
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
