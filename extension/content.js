(function() {
  if (document.getElementById('zenith-focus-overlay')) {
    return;
  }

  const overlay = document.createElement('div');
  overlay.id = 'zenith-focus-overlay';
  
  const content = document.createElement('div');
  content.className = 'zenith-focus-content';

  const icon = document.createElement('div');
  icon.className = 'zenith-focus-icon';
  icon.textContent = '⚠️';

  const title = document.createElement('h2');
  title.textContent = 'Focus Broken';

  const desc = document.createElement('p');
  desc.textContent = 'You switched away from your focus session.';

  const btn = document.createElement('button');
  btn.className = 'zenith-focus-btn';
  btn.textContent = 'Return To Focus';

  btn.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'returnToZenith' });
    overlay.remove();
    if (document.body) document.body.style.overflow = '';
  });

  content.appendChild(icon);
  content.appendChild(title);
  content.appendChild(desc);
  content.appendChild(btn);
  overlay.appendChild(content);

  const targetNode = document.body || document.documentElement;
  if (targetNode) {
      targetNode.appendChild(overlay);
      if (document.body) document.body.style.overflow = 'hidden';
  }
})();
