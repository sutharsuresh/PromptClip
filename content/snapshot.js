// Snapshot Area Selection Overlay
(function() {
  // Prevent multiple injections - check and set flag immediately
  if (document.getElementById('promptclip-snapshot-overlay')) {
    console.log('Snapshot overlay already exists, aborting');
    return;
  }
  
  if (window.__promptclipSnapshotActive) {
    console.log('Snapshot already active, aborting');
    return;
  }
  window.__promptclipSnapshotActive = true;

  let overlay, selectionBox, instructionsPanel, startX, startY, isSelecting = false;
  let messageListenerAdded = false;

  // Listen for crop and save message from background - add listener only once
  if (!messageListenerAdded) {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      console.log('Snapshot received message:', message.action);
      if (message.action === 'cropAndSave') {
        cropAndSaveSnapshot(message.dataUrl, message.area);
        sendResponse({ success: true });
      }
      return true;
    });
    messageListenerAdded = true;
  }

  function cropAndSaveSnapshot(dataUrl, area) {
    console.log('Starting crop and save, area:', area);
    const img = new Image();
    img.onload = function() {
      try {
        console.log('Image loaded, dimensions:', img.width, 'x', img.height);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Account for device pixel ratio
        const dpr = area.devicePixelRatio;
        const cropX = (area.x - area.scrollX) * dpr;
        const cropY = (area.y - area.scrollY) * dpr;
        const cropWidth = area.width * dpr;
        const cropHeight = area.height * dpr;
        
        console.log('Crop coordinates:', { cropX, cropY, cropWidth, cropHeight });
        
        canvas.width = cropWidth;
        canvas.height = cropHeight;
        
        // Draw cropped portion
        ctx.drawImage(
          img,
          cropX, cropY, cropWidth, cropHeight,
          0, 0, cropWidth, cropHeight
        );
        
        // Convert to data URL
        const croppedDataUrl = canvas.toDataURL('image/png');
        console.log('Cropped image data URL length:', croppedDataUrl.length);
        
        // Save snapshot to storage
        chrome.storage.local.get(['clips', 'activeFolder'], (data) => {
          const clips = data.clips || [];
          const activeFolder = data.activeFolder || 'General';
          
          const snapshot = {
            type: 'snapshot',
            imageData: croppedDataUrl,
            url: window.location.href,
            title: document.title,
            timestamp: Date.now(),
            folder: activeFolder,
            tags: ['snapshot', 'visual'],
            width: area.width,
            height: area.height
          };
          
          console.log('Saving snapshot to storage, folder:', activeFolder);
          clips.push(snapshot);
          
          chrome.storage.local.set({ clips }, () => {
            console.log('Snapshot saved, total clips:', clips.length);
            
            // Update badge
            chrome.runtime.sendMessage({ 
              action: 'updateBadge', 
              count: clips.length 
            });
            
            // Show notification
            showNotification('Snapshot captured!');
          });
        });
      } catch (err) {
        console.error('Snapshot crop error:', err);
        showNotification('Failed to capture snapshot');
      }
    };
    img.onerror = function() {
      console.error('Failed to load captured image');
      showNotification('Failed to capture snapshot');
    };
    img.src = dataUrl;
  }

  function showNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #10b981;
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 14px;
      z-index: 2147483649;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
      animation: slideIn 0.3s ease-out;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease-in';
      setTimeout(() => notification.remove(), 300);
    }, 2000);
  }

  // Create overlay UI
  function createOverlay() {
    // Dark overlay
    overlay = document.createElement('div');
    overlay.id = 'promptclip-snapshot-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      z-index: 2147483647;
      cursor: crosshair;
    `;

    // Selection box
    selectionBox = document.createElement('div');
    selectionBox.style.cssText = `
      position: fixed;
      border: 2px dashed #6366f1;
      background: rgba(99, 102, 241, 0.1);
      display: none;
      z-index: 2147483648;
      pointer-events: none;
    `;

    // Instructions
    instructionsPanel = document.createElement('div');
    instructionsPanel.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: #1f2937;
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 14px;
      z-index: 2147483649;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
    `;
    instructionsPanel.innerHTML = `
      <div style="text-align: center;">
        <strong>📸 Snapshot Mode</strong><br>
        <span style="font-size: 12px; color: #9ca3af;">Drag to select an area • Press ESC to cancel</span>
      </div>
    `;

    document.body.appendChild(overlay);
    document.body.appendChild(selectionBox);
    document.body.appendChild(instructionsPanel);

    // Event listeners
    overlay.addEventListener('mousedown', startSelection);
    overlay.addEventListener('mousemove', updateSelection);
    overlay.addEventListener('mouseup', endSelection);
    document.addEventListener('keydown', handleEscape);
  }

  function startSelection(e) {
    isSelecting = true;
    startX = e.clientX;
    startY = e.clientY;
    
    selectionBox.style.left = startX + 'px';
    selectionBox.style.top = startY + 'px';
    selectionBox.style.width = '0px';
    selectionBox.style.height = '0px';
    selectionBox.style.display = 'block';
  }

  function updateSelection(e) {
    if (!isSelecting) return;

    const currentX = e.clientX;
    const currentY = e.clientY;
    
    const width = Math.abs(currentX - startX);
    const height = Math.abs(currentY - startY);
    const left = Math.min(currentX, startX);
    const top = Math.min(currentY, startY);

    selectionBox.style.left = left + 'px';
    selectionBox.style.top = top + 'px';
    selectionBox.style.width = width + 'px';
    selectionBox.style.height = height + 'px';
  }

  function endSelection(e) {
    if (!isSelecting) return;
    isSelecting = false;

    const rect = selectionBox.getBoundingClientRect();
    
    if (rect.width < 10 || rect.height < 10) {
      cleanup();
      return;
    }

    // Store coordinates before hiding overlay
    const captureArea = {
      x: rect.left + window.scrollX,
      y: rect.top + window.scrollY,
      width: rect.width,
      height: rect.height,
      scrollX: window.scrollX,
      scrollY: window.scrollY,
      devicePixelRatio: window.devicePixelRatio || 1
    };

    // Hide overlay immediately before capture
    if (overlay) overlay.style.display = 'none';
    if (selectionBox) selectionBox.style.display = 'none';
    if (instructionsPanel) instructionsPanel.style.display = 'none';

    // Small delay to ensure DOM updates before capture
    setTimeout(() => {
      // Send coordinates back to background script
      chrome.runtime.sendMessage({
        action: 'captureSnapshot',
        area: captureArea
      });

      // Cleanup after capture
      setTimeout(cleanup, 100);
    }, 50);
  }

  function handleEscape(e) {
    if (e.key === 'Escape') {
      cleanup();
    }
  }

  function cleanup() {
    // Remove overlay elements
    if (overlay && overlay.parentNode) {
      overlay.parentNode.removeChild(overlay);
    }
    if (selectionBox && selectionBox.parentNode) {
      selectionBox.parentNode.removeChild(selectionBox);
    }
    if (instructionsPanel && instructionsPanel.parentNode) {
      instructionsPanel.parentNode.removeChild(instructionsPanel);
    }
    
    // Remove event listener
    document.removeEventListener('keydown', handleEscape);
    
    // Reset flag
    window.__promptclipSnapshotActive = false;
  }

  // Initialize overlay
  try {
    createOverlay();
  } catch (err) {
    console.error('Failed to create snapshot overlay:', err);
    window.__promptclipSnapshotActive = false;
  }
})();
