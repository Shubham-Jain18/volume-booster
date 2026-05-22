document.getElementById('gain-slider').addEventListener('input', async (e) => {
  const val = parseFloat(e.target.value);
  document.getElementById('multiplier').innerText = Math.round(val * 100);

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) return;

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: setTabVolume,
    args: [val]
  });
});

// This function runs directly inside the context of the target web page
function setTabVolume(gainValue) {
  if (window.audioContextInitialized) {
    if (window.gainNode) {
      window.gainNode.gain.value = gainValue;
    }
    return;
  }

  // Find all audio/video elements on the current page
  const mediaElements = document.querySelectorAll('video, audio');
  if (mediaElements.length === 0) return;

  // Initialize the Web Audio API context
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const ctx = new AudioContext();
  const gainNode = ctx.createGain();
  gainNode.gain.value = gainValue;

  mediaElements.forEach(element => {
    // Cross-origin attribute setup prevents CORS errors for external video streams
    if (!element.crossOrigin) {
      element.crossOrigin = "anonymous";
    }
    
    const source = ctx.createMediaElementSource(element);
    source.connect(gainNode);
  });

  gainNode.connect(ctx.destination);

  // Store references globally on the window object to prevent duplicate chains on subsequent slider shifts
  window.audioContextInitialized = true;
  window.gainNode = gainNode;
}