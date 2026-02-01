// Initialize Context Menu and State
chrome.runtime.onInstalled.addListener(async () => {
  chrome.contextMenus.create({
    id: "clipToPrompt",
    title: "Send selection to PromptClip",
    contexts: ["selection"],
  });
  
  // Initialize storage if empty and update badge
  const data = await chrome.storage.local.get(['clips']);
  if (!data.clips) {
    await chrome.storage.local.set({ clips: [], activeFolder: "General" });
  }
  
  const count = data.clips ? data.clips.length : 0;
  chrome.action.setBadgeText({ text: count > 0 ? count.toString() : '' });
  chrome.action.setBadgeBackgroundColor({ color: '#6366f1' });
  
  updateExtensionIcon('#6366f1');
});

// Handle Context Menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "clipToPrompt" && info.selectionText) {
    saveClip(tab.id, info.selectionText);
  }
});

// Handle Keyboard Shortcut (Alt+Shift+X)
chrome.commands.onCommand.addListener((command) => {
  if (command === "clip_selection") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs[0]) return;
      chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        func: () => window.getSelection().toString()
      }, (results) => {
        if (results && results[0].result) {
          const clippedText = results[0].result.trim();
          if (clippedText.length > 0) {
            saveClip(tabs[0].id, clippedText);
          }
        }
      });
    });
  }
});

// Handle messages from Popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "navigateToSource") {
    const { url, text } = message;
    
    chrome.tabs.query({}, (tabs) => {
      const existingTab = tabs.find(t => t.url === url);
      
      if (existingTab) {
        chrome.tabs.update(existingTab.id, { active: true }, () => {
          chrome.windows.update(existingTab.windowId, { focused: true });
          executeScrollToText(existingTab.id, text);
        });
      } else {
        chrome.tabs.create({ url: url }, (newTab) => {
          chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
            if (tabId === newTab.id && info.status === 'complete') {
              chrome.tabs.onUpdated.removeListener(listener);
              executeScrollToText(newTab.id, text);
            }
          });
        });
      }
    });
  } else if (message.action === "captureSnapshot") {
    // Capture the visible tab and crop to selected area
    console.log('Capturing snapshot with area:', message.area);
    
    chrome.tabs.captureVisibleTab(null, { format: 'png' }, (dataUrl) => {
      if (chrome.runtime.lastError) {
        console.error('Capture error:', chrome.runtime.lastError);
        return;
      }
      
      if (!dataUrl) {
        console.error('No data URL returned from capture');
        return;
      }
      
      console.log('Captured image, data URL length:', dataUrl.length);
      
      // Send captured image to content script for cropping
      const area = message.area;
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
          console.log('Sending crop message to tab:', tabs[0].id);
          chrome.tabs.sendMessage(tabs[0].id, {
            action: 'cropAndSave',
            dataUrl: dataUrl,
            area: area
          }, (response) => {
            if (chrome.runtime.lastError) {
              console.error('Message send error:', chrome.runtime.lastError);
            }
          });
        } else {
          console.error('No active tab found for sending crop message');
        }
      });
    });
    return true;
  } else if (message.action === "updateBadge") {
    // Update badge count
    const count = message.count || 0;
    chrome.action.setBadgeText({ text: count > 0 ? count.toString() : '' });
    chrome.action.setBadgeBackgroundColor({ color: '#6366f1' });
    return true;
  }
});

// Helper function to inject scroll-to-text logic
function executeScrollToText(tabId, text) {
  chrome.scripting.executeScript({
    target: { tabId: tabId },
    func: (targetText) => {
      // Normalize the text for better matching
      const normalizedTarget = targetText.trim().substring(0, 100).toLowerCase();
      
      // Try to find the text using window.find first (most reliable)
      if (window.find && window.find(targetText.substring(0, 50))) {
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          const element = range.commonAncestorContainer.parentElement || range.commonAncestorContainer;
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          
          // Highlight the element
          const originalBg = element.style.backgroundColor;
          element.style.transition = 'background-color 0.5s';
          element.style.backgroundColor = 'rgba(255, 255, 0, 0.6)';
          setTimeout(() => { 
            element.style.backgroundColor = originalBg; 
          }, 2500);
          
          selection.removeAllRanges();
          return;
        }
      }
      
      // Fallback: Walk through all text nodes
      const walker = document.createTreeWalker(
        document.body, 
        NodeFilter.SHOW_TEXT, 
        null, 
        false
      );
      
      let node;
      let found = false;
      
      while (node = walker.nextNode()) {
        const nodeText = node.textContent.trim().toLowerCase();
        
        // Check if this node contains part of our target text
        if (nodeText && normalizedTarget.includes(nodeText.substring(0, 30)) || 
            nodeText.includes(normalizedTarget.substring(0, 30))) {
          const parent = node.parentElement;
          if (parent) {
            parent.scrollIntoView({ behavior: 'smooth', block: 'center' });
            
            const originalBg = parent.style.backgroundColor;
            parent.style.transition = 'background-color 0.5s';
            parent.style.backgroundColor = 'rgba(255, 255, 0, 0.6)';
            setTimeout(() => { 
              parent.style.backgroundColor = originalBg; 
            }, 2500);
            
            found = true;
            break;
          }
        }
      }
      
      // If still not found, try searching all elements for the text
      if (!found) {
        const allElements = document.querySelectorAll('p, div, span, td, li, h1, h2, h3, h4, h5, h6');
        for (const elem of allElements) {
          const elemText = elem.textContent.trim().toLowerCase();
          if (elemText.includes(normalizedTarget.substring(0, 50))) {
            elem.scrollIntoView({ behavior: 'smooth', block: 'center' });
            
            const originalBg = elem.style.backgroundColor;
            elem.style.transition = 'background-color 0.5s';
            elem.style.backgroundColor = 'rgba(255, 255, 0, 0.6)';
            setTimeout(() => { 
              elem.style.backgroundColor = originalBg; 
            }, 2500);
            break;
          }
        }
      }
    },
    args: [text]
  });
}

// Updated function to generate a Rounded Square icon to match your requested scale
async function updateExtensionIcon(color) {
  const size = 128;
  const canvas = new OffscreenCanvas(size, size);
  const ctx = canvas.getContext('2d');
  const radius = size * 0.2; 

  const gradient = ctx.createLinearGradient(0, 0, 0, size);
  gradient.addColorStop(0, color);
  gradient.addColorStop(1, adjustColor(color, -20));
  
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.moveTo(radius, 0);
  ctx.lineTo(size - radius, 0);
  ctx.quadraticCurveTo(size, 0, size, radius);
  ctx.lineTo(size, size - radius);
  ctx.quadraticCurveTo(size, size, size - radius, size);
  ctx.lineTo(radius, size);
  ctx.quadraticCurveTo(0, size, 0, size - radius);
  ctx.lineTo(0, radius);
  ctx.quadraticCurveTo(0, 0, radius, 0);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "white";
  ctx.font = `bold ${size * 0.9}px sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("P", size / 2, size / 2);

  const imageData = ctx.getImageData(0, 0, size, size);
  chrome.action.setIcon({ imageData: imageData });
}

function adjustColor(hex, amt) {
  let usePound = false;
  if (hex[0] == "#") { hex = hex.slice(1); usePound = true; }
  let num = parseInt(hex, 16);
  let r = (num >> 16) + amt;
  r = Math.max(0, Math.min(255, r));
  let g = ((num >> 8) & 0x00FF) + amt;
  g = Math.max(0, Math.min(255, g));
  let b = (num & 0x0000FF) + amt;
  b = Math.max(0, Math.min(255, b));
  return (usePound ? "#" : "") + (b | (g << 8) | (r << 16)).toString(16).padStart(6, '0');
}

// Auto-tagging: Universal semantic tag extraction from text
function extractTags(text, url, title) {
  const tags = new Set();
  const lowerText = text.toLowerCase();
  const lowerTitle = title.toLowerCase();
  
  // Extract proper nouns and meaningful segments from URL path
  try {
    const urlPath = new URL(url).pathname;
    const pathSegments = urlPath.split('/').filter(s => s && s.length > 2);
    
    pathSegments.forEach(segment => {
      // Extract meaningful names (2-20 chars, alphanumeric with hyphens)
      if (/^[a-z0-9-]{2,20}$/i.test(segment)) {
        const cleaned = segment.toLowerCase();
        // Skip very common web path words
        const skipWords = ['www', 'blog', 'post', 'page', 'article', 'content', 'media', 'images', 'img', 'assets', 'static', 'files'];
        if (!skipWords.includes(cleaned)) {
          tags.add(cleaned);
        }
      }
    });
    
    // Extract domain-specific tags
    const hostname = new URL(url).hostname;
    if (hostname.includes('stackoverflow')) tags.add('stackoverflow');
    if (hostname.includes('github')) tags.add('github');
    if (hostname.includes('medium')) tags.add('medium');
    if (hostname.includes('dev.to')) tags.add('dev');
    if (hostname.includes('reddit')) tags.add('reddit');
    if (hostname.includes('youtube')) tags.add('youtube');
    if (hostname.includes('amazon')) tags.add('shopping');
    if (hostname.includes('wikipedia')) tags.add('wiki');
    if (hostname.includes('news')) tags.add('news');
  } catch (e) {}
  
  // Extract meaningful words from title (universal stop words)
  const stopWords = new Set([
    'the', 'how', 'what', 'why', 'when', 'where', 'which', 'who', 'whom',
    'with', 'from', 'into', 'during', 'through', 'about', 'above', 'below',
    'for', 'and', 'or', 'but', 'if', 'then', 'than', 'such', 'both', 'either',
    'in', 'on', 'at', 'to', 'of', 'by', 'as',
    'a', 'an', 'the', 'this', 'that', 'these', 'those',
    'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
    'do', 'does', 'did', 'will', 'would', 'should', 'could', 'may', 'might', 'must',
    'can', 'am', 'your', 'you', 'my', 'their', 'our', 'his', 'her', 'its'
  ]);
  
  const titleWords = lowerTitle.split(/[\s\-_|:,;.!?()]+/).filter(w => 
    w.length > 2 && 
    w.length < 25 && 
    !stopWords.has(w) && 
    /^[a-z0-9]+$/i.test(w)
  );
  
  // Add first 4 meaningful title words as tags
  titleWords.slice(0, 4).forEach(word => tags.add(word));
  
  // Extract topic categories and concepts from content
  const topicPatterns = [
    // Technology & Programming
    { pattern: /\b(code|coding|programming|software|developer|algorithm)\b/i, tag: 'tech' },
    { pattern: /\b(api|rest|database|cloud|deployment|devops)\b/i, tag: 'development' },
    { pattern: /\b(ai|artificial intelligence|machine learning|ml|neural|deep learning)\b/i, tag: 'ai' },
    
    // Business & Finance
    { pattern: /\b(business|marketing|startup|entrepreneur|commerce|sales)\b/i, tag: 'business' },
    { pattern: /\b(finance|investment|stock|crypto|bitcoin|trading|money)\b/i, tag: 'finance' },
    { pattern: /\b(strategy|management|leadership|productivity|workflow)\b/i, tag: 'strategy' },
    
    // Creative & Design
    { pattern: /\b(design|ui|ux|graphic|visual|creative|art|illustration)\b/i, tag: 'design' },
    { pattern: /\b(photography|photo|camera|lens|portrait|landscape)\b/i, tag: 'photography' },
    { pattern: /\b(fashion|style|clothing|outfit|trend|runway)\b/i, tag: 'fashion' },
    { pattern: /\b(music|song|album|artist|band|concert|instrument)\b/i, tag: 'music' },
    { pattern: /\b(video|film|movie|cinema|director|editing)\b/i, tag: 'video' },
    
    // Content & Media
    { pattern: /\b(book|novel|story|author|chapter|literature|reading)\b/i, tag: 'books' },
    { pattern: /\b(blog|article|writing|post|essay|content)\b/i, tag: 'writing' },
    { pattern: /\b(podcast|episode|audio|radio|interview)\b/i, tag: 'podcast' },
    { pattern: /\b(news|journalism|press|media|report)\b/i, tag: 'news' },
    
    // Education & Learning
    { pattern: /\b(tutorial|guide|howto|learn|course|lesson|training)\b/i, tag: 'tutorial' },
    { pattern: /\b(education|school|university|student|study|academic)\b/i, tag: 'education' },
    { pattern: /\b(research|study|analysis|experiment|scientific|paper)\b/i, tag: 'research' },
    
    // Lifestyle & Health
    { pattern: /\b(health|fitness|workout|exercise|nutrition|diet|wellness)\b/i, tag: 'health' },
    { pattern: /\b(recipe|cooking|food|cuisine|chef|ingredient|meal)\b/i, tag: 'food' },
    { pattern: /\b(travel|vacation|trip|destination|tourism|adventure)\b/i, tag: 'travel' },
    { pattern: /\b(home|house|interior|furniture|decor|renovation)\b/i, tag: 'home' },
    
    // Entertainment & Gaming
    { pattern: /\b(game|gaming|esports|player|console|nintendo|playstation|xbox)\b/i, tag: 'gaming' },
    { pattern: /\b(sports|football|basketball|soccer|tennis|athlete|championship)\b/i, tag: 'sports' },
    { pattern: /\b(entertainment|celebrity|hollywood|actor|actress)\b/i, tag: 'entertainment' },
    
    // Science & Nature
    { pattern: /\b(science|physics|chemistry|biology|astronomy|laboratory)\b/i, tag: 'science' },
    { pattern: /\b(nature|environment|climate|ecology|wildlife|conservation)\b/i, tag: 'nature' },
    { pattern: /\b(history|historical|ancient|civilization|war|revolution)\b/i, tag: 'history' },
    
    // DIY & Crafts
    { pattern: /\b(diy|craft|handmade|maker|build|project|workshop)\b/i, tag: 'diy' },
    { pattern: /\b(gardening|garden|plant|flower|grow|seeds)\b/i, tag: 'gardening' },
    
    // Practical
    { pattern: /\b(tips|advice|recommendation|suggestion|hack|trick)\b/i, tag: 'tips' },
    { pattern: /\b(review|comparison|versus|vs|rating|opinion)\b/i, tag: 'review' },
    { pattern: /\b(shopping|product|buy|purchase|deal|discount)\b/i, tag: 'shopping' },
  ];
  
  topicPatterns.forEach(({ pattern, tag }) => {
    if (pattern.test(text) || pattern.test(title)) {
      tags.add(tag);
    }
  });
  
  // Extract capitalized words (potential proper nouns, brands, names)
  const capitalizedWords = text.match(/\b[A-Z][a-z]{2,14}\b/g) || [];
  const uniqueCapitalized = [...new Set(capitalizedWords.map(w => w.toLowerCase()))];
  uniqueCapitalized.slice(0, 3).forEach(word => {
    if (word.length > 3 && !stopWords.has(word)) {
      tags.add(word);
    }
  });
  
  // Extract hashtags if present
  const hashtagMatches = text.match(/#([a-zA-Z0-9_]+)/g) || [];
  hashtagMatches.forEach(tag => {
    const cleaned = tag.substring(1).toLowerCase();
    if (cleaned.length > 2 && cleaned.length < 20) {
      tags.add(cleaned);
    }
  });
  
  // Extract quoted phrases as potential tags
  const quotedPhrases = text.match(/"([^"]{3,20})"/g) || [];
  quotedPhrases.slice(0, 2).forEach(phrase => {
    const cleaned = phrase.replace(/"/g, '').toLowerCase().trim();
    const words = cleaned.split(/\s+/);
    if (words.length <= 2) {
      tags.add(cleaned.replace(/\s+/g, '-'));
    }
  });
  
  // Limit to 8 most relevant tags
  return Array.from(tags).slice(0, 8);
}

async function saveClip(tabId, text) {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  const tab = tabs[0];
  const data = await chrome.storage.local.get(['clips', 'activeFolder']);
  const clips = data.clips || [];
  const folder = data.activeFolder || "General";
  
  if (clips.length > 0 && clips[clips.length - 1].text === text) return;

  // Auto-generate tags
  const tags = extractTags(text, tab?.url || "Unknown", tab?.title || "Unknown");

  const newClip = {
    text: text,
    url: tab?.url || "Unknown",
    title: tab?.title || "Unknown",
    folder: folder,
    timestamp: Date.now(),
    tags: tags
  };

  clips.push(newClip);
  await chrome.storage.local.set({ clips });
  
  chrome.action.setBadgeText({ text: clips.length > 0 ? clips.length.toString() : '' });
  chrome.action.setBadgeBackgroundColor({ color: '#6366f1' });

  updateExtensionIcon('#10b981'); 
  setTimeout(() => updateExtensionIcon('#6366f1'), 800); 

  chrome.runtime.sendMessage({ action: "refreshUI" }).catch(() => {});
}