document.getElementById('gain-slider').addEventListener('input', async (e) => {
  const val = parseFloat(e.target.value);
  document.getElementById('multiplier').innerText = Math.round(val * 100);

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) return;

  chrome.scripting.executeScript({
    target: { tabId: tab.id, allFrames: true },
    func: setTabVolume,
    args: [val]
  });
});

function setTabVolume(gainValue) {
  if (window.audioContextInitialized) {
    if (window.gainNode) {
      window.gainNode.gain.value = gainValue;
    }
    return;
  }

  const mediaElements = document.querySelectorAll('video, audio');
  if (mediaElements.length === 0) return;

  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const ctx = new AudioContext();
  const gainNode = ctx.createGain();
  gainNode.gain.value = gainValue;

  mediaElements.forEach(element => {
    if (!element.crossOrigin) {
      element.crossOrigin = "anonymous";
    }
    const source = ctx.createMediaElementSource(element);
    source.connect(gainNode);
  });

  gainNode.connect(ctx.destination);

  window.audioContextInitialized = true;
  window.gainNode = gainNode;
}