document.addEventListener('DOMContentLoaded', async () => {
  const clipBtn = document.getElementById('clip-btn');
  const snapshotBtn = document.getElementById('snapshot-btn');
  const copyBtn = document.getElementById('copy-btn');
  const buildPromptBtn = document.getElementById('build-prompt-btn');
  const clearBtn = document.getElementById('clear-btn');
  const folderPicker = document.getElementById('folder-picker');
  const templatePicker = document.getElementById('template-picker');
  const templateManager = document.getElementById('template-manager');
  const templateList = document.getElementById('template-list');
  const customTemplateInput = document.getElementById('custom-template-input');
  const customTemplateArea = document.getElementById('custom-template-area');
  const templateNameInput = document.getElementById('template-name-input');
  const templateInputTitle = document.getElementById('template-input-title');
  const saveTemplateBtn = document.getElementById('save-template-btn');
  const cancelTemplateBtn = document.getElementById('cancel-template-btn');
  const folderManager = document.getElementById('folder-manager');
  const folderList = document.getElementById('folder-list');
  const newFolderInput = document.getElementById('new-folder-input');
  const newFolderName = document.getElementById('new-folder-name');
  const iconPicker = document.getElementById('icon-picker');
  const createFolderBtn = document.getElementById('create-folder-btn');
  const cancelFolderBtn = document.getElementById('cancel-folder-btn');
  const clipList = document.getElementById('clip-list');
  const tokenDisplay = document.getElementById('token-count');
  const countDisplay = document.getElementById('clip-count');
  const selectionBar = document.getElementById('selection-bar');
  const selectionCount = document.getElementById('selection-count');
  const searchBox = document.getElementById('search-box');
  const clearSearch = document.getElementById('clear-search');
  const customTagsInput = document.getElementById('custom-tags-input');
  const newTagInput = document.getElementById('new-tag-input');
  const addTagBtn = document.getElementById('add-tag-btn');
  const cancelTagBtn = document.getElementById('cancel-tag-btn');
  const toast = document.getElementById('toast');
  const helpButton = document.getElementById('help-button');
  
  let selectedSnippets = new Set(); // Track selected snippet IDs
  let currentSearchTerm = ''; // Track current search
  let customFolders = []; // Track custom folders with icons
  let customTemplates = []; // Track custom templates
  let currentSnippetForTag = null; // Track which snippet we're adding a tag to
  let selectedIcon = '📁'; // Default icon for new folders
  let currentEditingTemplate = null; // Track template being edited
  
  // Help button - opens help page in new tab
  helpButton.addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('popup/help.html') });
  });
  
  // Helper function to show toast messages
  const showToast = (message, duration = 1500) => {
    toast.textContent = message;
    toast.style.display = 'block';
    setTimeout(() => toast.style.display = 'none', duration);
  };
  
  // Available icons for folders
  const availableIcons = ['📁', '📂', '🗂️', '📋', '📌', '🎯', '⭐', '💡', '🔥', '✨', '🎨', '🚀', '⚡', '💼', '🏠', '🔍', '📊', '💻', '🎓', '🏆', '🎮', '🎬', '📚', '🔧', '⚙️', '🛠️', '📦', '🎁', '💎', '🌟', '🔔', '📱'];

  // Default templates for formatting snippets
  const defaultTemplates = {
    plain: '{{text}}',
    
    xml: `<snippet>
  <metadata>
    <source>{{url}}</source>
    <title>{{title}}</title>
    <timestamp>{{timestamp}}</timestamp>
    <tags>{{tags}}</tags>
  </metadata>
  <content>
{{text}}
  </content>
</snippet>`,
    
    markdown: `### SOURCE
**URL:** {{url}}  
**Title:** {{title}}  
**Captured:** {{timestamp}}  
**Tags:** {{tags}}

---

{{text}}

---`,
    
    'dev-notes': `/* DEV NOTE - {{title}} */
// Source: {{url}}
// Date: {{timestamp}}
// Tags: {{tags}}

{{text}}

/* END NOTE */`,
    
    research: `📚 RESEARCH EXCERPT

Source: {{title}}
Link: {{url}}
Date: {{timestamp}}
Categories: {{tags}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{{text}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    
    'md-image': `### 📸 Visual Context

The following image is a snapshot from [{{url}}]({{url}}). 

**Image Details:**
- Source: {{title}}
- Captured: {{timestamp}}
- Tags: {{tags}}

Based on this visual and the context below, please analyze and provide insights...

---

{{text}}

---

*Note: For best results with multimodal AI, ensure the image data is included in your prompt.*`
  };

  // Auto-tagging: Universal semantic tag extraction from text
  const extractTags = (text, url, title) => {
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
  };

  // Format snippet with selected template
  const formatSnippet = (clip, templateType = 'plain') => {
    // Check if it's a custom template
    const customTemplate = customTemplates.find(t => t.id === templateType);
    const template = customTemplate 
      ? customTemplate.content 
      : defaultTemplates[templateType] || defaultTemplates.plain;
    
    const timestamp = new Date(clip.timestamp).toLocaleString();
    const tagsString = clip.tags?.join(', ') || 'none';
    
    // Handle snapshots
    if (clip.type === 'snapshot') {
      const snapshotText = `[Visual Snapshot: ${clip.width}×${clip.height}px image from ${clip.url}]`;
      return template
        .replace(/\{\{text\}\}/g, snapshotText + '\n\nImage Data:\n' + clip.imageData)
        .replace(/\{\{url\}\}/g, clip.url)
        .replace(/\{\{title\}\}/g, clip.title || 'Untitled')
        .replace(/\{\{timestamp\}\}/g, timestamp)
        .replace(/\{\{tags\}\}/g, tagsString)
        .replace(/\{\{folder\}\}/g, clip.folder || 'General');
    }
    
    // Regular text clips
    return template
      .replace(/\{\{text\}\}/g, clip.text)
      .replace(/\{\{url\}\}/g, clip.url)
      .replace(/\{\{title\}\}/g, clip.title || 'Untitled')
      .replace(/\{\{timestamp\}\}/g, timestamp)
      .replace(/\{\{tags\}\}/g, tagsString)
      .replace(/\{\{folder\}\}/g, clip.folder || 'General');
  };

  // Load preferences, custom folders, and custom templates
  const { 
    activeFolder, 
    activeTemplate,
    customFolders: savedFolders, 
    customTemplates: savedTemplates 
  } = await chrome.storage.local.get(['activeFolder', 'activeTemplate', 'customFolders', 'customTemplates']);
  
  customFolders = savedFolders || [];
  customTemplates = savedTemplates || [];
  
  // Set active folder and template
  if (activeFolder) {
    folderPicker.value = activeFolder;
  }
  if (activeTemplate) {
    templatePicker.value = activeTemplate;
  }
  
  // Render icon picker
  const renderIconPicker = () => {
    iconPicker.innerHTML = availableIcons.map(icon => 
      `<div class="icon-option ${icon === selectedIcon ? 'selected' : ''}" data-icon="${icon}">${icon}</div>`
    ).join('');
  };
  
  // Handle icon selection
  iconPicker.addEventListener('click', (e) => {
    if (e.target.classList.contains('icon-option')) {
      selectedIcon = e.target.getAttribute('data-icon');
      renderIconPicker();
    }
  });
  
  renderIconPicker();
  
  // Render folder manager list
  const renderFolderManager = () => {
    if (customFolders.length === 0) {
      folderList.innerHTML = '<div style="color: #9ca3af; font-size: 11px; padding: 8px 0;">No custom folders yet. Create one above!</div>';
      return;
    }
    
    folderList.innerHTML = customFolders.map(folder => `
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 6px; background: white; border-radius: 4px; margin-bottom: 4px;">
        <span style="font-size: 12px;">${folder.icon} ${folder.name}</span>
        <button class="delete-folder-btn" data-folder="${folder.name}" style="background: none; border: none; color: #ef4444; cursor: pointer; padding: 2px 6px; border-radius: 3px; font-size: 11px; font-weight: 600;" title="Delete this folder and move clips to General">Delete</button>
      </div>
    `).join('');
  };
  
  // Populate folder picker with custom folders
  const updateFolderPicker = () => {
    const defaultFolders = ['General', 'Work', 'Research', 'Personal'];
    const currentValue = folderPicker.value;
    
    // Clear and rebuild options
    folderPicker.innerHTML = `
      <option value="General">📂 General</option>
      <option value="Work">💼 Work</option>
      <option value="Research">🔍 Research</option>
      <option value="Personal">🏠 Personal</option>
    `;
    
    // Add custom folders
    customFolders.forEach(folder => {
      const option = document.createElement('option');
      option.value = folder.name;
      option.textContent = `${folder.icon} ${folder.name}`;
      folderPicker.appendChild(option);
    });
    
    // Add "Add New" and "Manage" options
    const addOption = document.createElement('option');
    addOption.value = '__add_new__';
    addOption.textContent = '➕ Add New Folder...';
    folderPicker.appendChild(addOption);
    
    const manageOption = document.createElement('option');
    manageOption.value = '__manage__';
    manageOption.textContent = '⚙️ Manage Folders...';
    folderPicker.appendChild(manageOption);
    
    // Restore previous value if it still exists
    if (currentValue && [...defaultFolders, ...customFolders.map(f => f.name)].includes(currentValue)) {
      folderPicker.value = currentValue;
    }
  };
  
  // Populate template picker with custom templates
  const updateTemplatePicker = () => {
    const defaultTemplateKeys = ['plain', 'xml', 'markdown', 'md-image', 'dev-notes', 'research'];
    const currentValue = templatePicker.value;
    
    // Clear and rebuild options
    templatePicker.innerHTML = `
      <option value="plain">📝 Plain</option>
      <option value="xml">🏷️ XML</option>
      <option value="markdown">📄 Markdown</option>
      <option value="md-image">📸 MD+Image</option>
      <option value="dev-notes">💻 Dev Notes</option>
      <option value="research">🔬 Research</option>
    `;
    
    // Add custom templates
    customTemplates.forEach(template => {
      const option = document.createElement('option');
      option.value = template.id;
      option.textContent = `✨ ${template.name}`;
      templatePicker.appendChild(option);
    });
    
    // Add "Add New" and "Manage" options
    const addOption = document.createElement('option');
    addOption.value = '__add_new__';
    addOption.textContent = '➕ New Template...';
    templatePicker.appendChild(addOption);
    
    const manageOption = document.createElement('option');
    manageOption.value = '__manage__';
    manageOption.textContent = '⚙️ Manage...';
    templatePicker.appendChild(manageOption);
    
    // Restore previous value if it still exists
    const allTemplateIds = [...defaultTemplateKeys, ...customTemplates.map(t => t.id)];
    if (currentValue && allTemplateIds.includes(currentValue)) {
      templatePicker.value = currentValue;
    }
  };
  
  // Render template manager list
  const renderTemplateManager = () => {
    if (customTemplates.length === 0) {
      templateList.innerHTML = '<div style="color: #9ca3af; font-size: 11px; padding: 8px 0;">No custom templates yet. Create one above!</div>';
      return;
    }
    
    templateList.innerHTML = customTemplates.map(template => `
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 6px; background: white; border-radius: 4px; margin-bottom: 4px;">
        <span style="font-size: 12px;">✨ ${template.name}</span>
        <div style="display: flex; gap: 4px;">
          <button class="edit-template-btn" data-id="${template.id}" style="background: none; border: none; color: #6366f1; cursor: pointer; padding: 2px 6px; border-radius: 3px; font-size: 11px; font-weight: 600;" title="Edit this template">Edit</button>
          <button class="delete-template-btn" data-id="${template.id}" style="background: none; border: none; color: #ef4444; cursor: pointer; padding: 2px 6px; border-radius: 3px; font-size: 11px; font-weight: 600;" title="Delete this template">Delete</button>
        </div>
      </div>
    `).join('');
  };
  
  updateFolderPicker();
  updateTemplatePicker();

  const updateUI = async () => {
    const { clips } = await chrome.storage.local.get(['clips']);
    const currentClips = clips || [];
    const selectedFolder = folderPicker.value;
    
    // Debug: Log clips to see what's in storage
    console.log('Total clips in storage:', currentClips.length);
    console.log('Clips data:', currentClips);
    const snapshots = currentClips.filter(c => c.type === 'snapshot');
    console.log('Snapshots found:', snapshots.length, snapshots);
    
    // Update dropdown with category-wise counts
    const folderCounts = {
      'General': 0,
      'Work': 0,
      'Research': 0,
      'Personal': 0
    };
    
    // Add custom folders to counts
    customFolders.forEach(folder => {
      folderCounts[folder.name] = 0;
    });
    
    currentClips.forEach(clip => {
      if (folderCounts.hasOwnProperty(clip.folder)) {
        folderCounts[clip.folder]++;
      }
    });
    
    // Update dropdown options with counts (skip the "Add New" and "Manage" options)
    Array.from(folderPicker.options).forEach(option => {
      if (option.value === '__add_new__' || option.value === '__manage__') return;
      
      const folderName = option.value;
      const count = folderCounts[folderName] || 0;
      const emoji = option.text.split(' ')[0]; // Get the emoji/icon
      option.text = `${emoji} ${folderName} (${count})`;
    });
    
    // Filter by folder
    const filteredClips = currentClips.filter(c => c.folder === selectedFolder);
    
    // Apply search filter if search term exists
    let displayClips = filteredClips;
    if (currentSearchTerm.trim()) {
      const searchLower = currentSearchTerm.toLowerCase();
      displayClips = filteredClips.filter(clip => {
        const tags = clip.tags || [];
        const textMatch = clip.text ? clip.text.toLowerCase().includes(searchLower) : false;
        const titleMatch = clip.title ? clip.title.toLowerCase().includes(searchLower) : false;
        const urlMatch = clip.url ? clip.url.toLowerCase().includes(searchLower) : false;
        const tagMatch = tags.some(tag => tag.toLowerCase().includes(searchLower));
        
        return textMatch || titleMatch || urlMatch || tagMatch;
      });
    }
    
    // Update Stats
    countDisplay.innerText = currentSearchTerm.trim() 
      ? `${displayClips.length} of ${filteredClips.length} Clips`
      : `${filteredClips.length} Clips in ${selectedFolder}`;
    
    // Rough Token Estimate
    const totalChars = displayClips.reduce((acc, c) => acc + (c.text ? c.text.length : 0), 0);
    tokenDisplay.innerText = `~${Math.round(totalChars / 4)} tokens`;

    // Update Global Badge Count (hide if 0)
    chrome.action.setBadgeText({ text: currentClips.length > 0 ? currentClips.length.toString() : '' });
    chrome.action.setBadgeBackgroundColor({ color: '#6366f1' });

    if (displayClips.length === 0) {
      clipList.innerHTML = currentSearchTerm.trim() 
        ? '<div style="text-align:center; padding:20px; color:#999; font-size:12px;">No snippets match your search</div>'
        : '<div style="text-align:center; padding:20px; color:#999; font-size:12px;">Folder empty</div>';
      return;
    }

    // Render list with delete buttons, checkboxes, tags, and clickable text
    clipList.innerHTML = displayClips.slice().reverse().map(clip => {
      // Debug logging
      if (clip.type === 'snapshot') {
        console.log('Rendering snapshot clip:', {
          type: clip.type,
          hasImageData: !!clip.imageData,
          imageDataLength: clip.imageData ? clip.imageData.length : 0,
          timestamp: clip.timestamp,
          folder: clip.folder
        });
      }
      
      const tags = clip.tags || [];
      const tagsHTML = tags.length > 0 
        ? `<div class="clip-tags">
            ${tags.map(tag => `<span class="tag" data-tag="${tag}" data-clip-id="${clip.timestamp}" title="Click tag to search">#${tag}<span class="tag-remove" data-tag="${tag}" data-clip-id="${clip.timestamp}" title="Remove this tag">×</span></span>`).join('')}
            <span class="tag" style="background: #f3f4f6; color: #6b7280; cursor: pointer;" data-add-tag="${clip.timestamp}" title="Add a custom tag to this snippet">+ Add Tag</span>
          </div>`
        : `<div class="clip-tags"><span class="tag" style="background: #f3f4f6; color: #6b7280; cursor: pointer;" data-add-tag="${clip.timestamp}" title="Add a custom tag to this snippet">+ Add Tag</span></div>`;
      
      // Render snapshots differently
      if (clip.type === 'snapshot' && clip.imageData) {
        console.log('Rendering snapshot HTML for clip:', clip.timestamp);
        return `
          <div class="clip-item">
            <input type="checkbox" class="clip-checkbox" data-id="${clip.timestamp}" ${selectedSnippets.has(clip.timestamp) ? 'checked' : ''} title="Select this snapshot to build a custom prompt">
            <div class="clip-content">
              <div class="clip-header">
                <div class="clip-meta" style="white-space: normal; overflow: visible; text-overflow: clip;">
                  <a href="${clip.url}" target="_blank" class="clip-url" title="Open ${clip.url} in new tab" style="color: inherit; text-decoration: none;">📸 ${new URL(clip.url).hostname}</a> • 
                  <span>${new Date(clip.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                </div>
                <button class="delete-btn" data-id="${clip.timestamp}" title="Delete this snapshot">×</button>
              </div>
              <div style="margin: 8px 0;">
                <img src="${clip.imageData}" 
                     style="max-width: 100%; height: auto; border-radius: 4px; border: 1px solid #e5e7eb; cursor: pointer; display: block;" 
                     data-snapshot-id="${clip.timestamp}" 
                     title="Click to view full size - ${clip.width}×${clip.height}px"
                     onerror="this.style.display='none'; this.parentElement.innerHTML='<div style=\\'color: #ef4444; font-size: 11px; padding: 8px; background: #fee2e2; border-radius: 4px;\\'>⚠️ Failed to load image</div>';">
                <div style="font-size: 11px; color: #6b7280; margin-top: 4px; display: flex; justify-content: space-between; align-items: center; white-space: nowrap;">
                  <span title="Image dimensions: ${clip.width} × ${clip.height} pixels">${clip.width}×${clip.height}px</span>
                  <div style="display: flex; gap: 4px;">
                    <button class="btn btn-secondary copy-image-btn" data-snapshot-id="${clip.timestamp}" style="padding: 4px 8px; font-size: 10px; margin: 0;" title="Copy image to clipboard">📋 Copy</button>
                    <button class="btn btn-secondary save-image-btn" data-snapshot-id="${clip.timestamp}" style="padding: 4px 8px; font-size: 10px; margin: 0;" title="Save image to downloads">💾 Save</button>
                  </div>
                </div>
              </div>
              ${tagsHTML}
            </div>
          </div>
        `;
      }
      
      // If it's a snapshot but no imageData, show error
      if (clip.type === 'snapshot' && !clip.imageData) {
        return `
          <div class="clip-item">
            <input type="checkbox" class="clip-checkbox" data-id="${clip.timestamp}" ${selectedSnippets.has(clip.timestamp) ? 'checked' : ''} title="Select this snapshot">
            <div class="clip-content">
              <div class="clip-header">
                <div class="clip-meta">
                  <a href="${clip.url}" target="_blank" class="clip-url" title="Open ${clip.url} in new tab" style="color: inherit; text-decoration: none;">📸 ${new URL(clip.url).hostname}</a> • 
                  <span>${new Date(clip.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                </div>
                <button class="delete-btn" data-id="${clip.timestamp}" title="Delete this snapshot">×</button>
              </div>
              <div style="margin: 8px 0; color: #ef4444; font-size: 11px; padding: 8px; background: #fee2e2; border-radius: 4px;">
                ⚠️ Snapshot data missing or corrupted
              </div>
              ${tagsHTML}
            </div>
          </div>
        `;
      }
      
      // Regular text clips
      return `
        <div class="clip-item">
          <input type="checkbox" class="clip-checkbox" data-id="${clip.timestamp}" ${selectedSnippets.has(clip.timestamp) ? 'checked' : ''} title="Select this snippet to build a custom prompt">
          <div class="clip-content">
            <div class="clip-header">
              <div class="clip-meta">
                <a href="${clip.url}" target="_blank" class="clip-url" title="Open ${clip.url} in new tab" style="color: inherit; text-decoration: none;">${new URL(clip.url).hostname}</a> • 
                <span>${new Date(clip.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
              </div>
              <button class="delete-btn" data-id="${clip.timestamp}" title="Delete this snippet">×</button>
            </div>
            <div class="clip-text" data-id="${clip.timestamp}" title="${clip.text ? clip.text.replace(/"/g, '&quot;') : ''}">${clip.text ? clip.text.substring(0, 100) : ''}${clip.text && clip.text.length > 100 ? '...' : ''}</div>
            ${tagsHTML}
          </div>
        </div>
      `;
    }).join('');
    
    updateSelectionUI();
  };
  
  const updateSelectionUI = () => {
    const count = selectedSnippets.size;
    
    if (count > 0) {
      selectionBar.classList.add('active');
      selectionCount.textContent = `${count} snippet${count > 1 ? 's' : ''} selected`;
      buildPromptBtn.disabled = false;
    } else {
      selectionBar.classList.remove('active');
      buildPromptBtn.disabled = true;
    }
  };

  // Handle individual snippet deletion and navigation
  clipList.addEventListener('click', async (e) => {
    // 0a. Handle Copy Image Button
    if (e.target.classList.contains('copy-image-btn')) {
      e.stopPropagation();
      const snapshotId = parseInt(e.target.getAttribute('data-snapshot-id'));
      const { clips } = await chrome.storage.local.get(['clips']);
      const snapshot = clips.find(c => c.timestamp === snapshotId);
      
      if (snapshot && snapshot.imageData) {
        try {
          // Convert data URL to blob
          const response = await fetch(snapshot.imageData);
          const blob = await response.blob();
          
          // Copy to clipboard
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
          ]);
          
          showToast('Image copied to clipboard!');
        } catch (err) {
          console.error('Copy failed:', err);
          showToast('Failed to copy image');
        }
      }
      return;
    }
    
    // 0b. Handle Save Image Button
    if (e.target.classList.contains('save-image-btn')) {
      e.stopPropagation();
      const snapshotId = parseInt(e.target.getAttribute('data-snapshot-id'));
      const { clips } = await chrome.storage.local.get(['clips']);
      const snapshot = clips.find(c => c.timestamp === snapshotId);
      
      if (snapshot && snapshot.imageData) {
        // Create download link
        const link = document.createElement('a');
        link.href = snapshot.imageData;
        link.download = `snapshot-${new Date(snapshot.timestamp).toISOString().slice(0, 10)}-${snapshot.timestamp}.png`;
        link.click();
        showToast('Image saved!');
      }
      return;
    }
    
    // 0c. Handle Tag Removal
    if (e.target.classList.contains('tag-remove')) {
      e.stopPropagation();
      const tag = e.target.getAttribute('data-tag');
      const clipId = parseInt(e.target.getAttribute('data-clip-id'));
      
      const { clips } = await chrome.storage.local.get(['clips']);
      const clipIndex = clips.findIndex(c => c.timestamp === clipId);
      if (clipIndex !== -1) {
        clips[clipIndex].tags = (clips[clipIndex].tags || []).filter(t => t !== tag);
        await chrome.storage.local.set({ clips });
        updateUI();
      }
      return;
    }
    
    // 0d. Handle Add Tag
    if (e.target.hasAttribute('data-add-tag')) {
      e.stopPropagation();
      currentSnippetForTag = parseInt(e.target.getAttribute('data-add-tag'));
      customTagsInput.style.display = 'block';
      newTagInput.focus();
      return;
    }
    
    // 0e. Handle Tag Click - filter by tag
    if (e.target.classList.contains('tag') && !e.target.hasAttribute('data-add-tag')) {
      const tag = e.target.getAttribute('data-tag');
      if (tag) {
        searchBox.value = tag;
        currentSearchTerm = tag;
        clearSearch.style.display = 'block';
        updateUI();
      }
      return;
    }
    
    // 1. Handle Checkbox Toggle
    if (e.target.classList.contains('clip-checkbox')) {
      const id = parseInt(e.target.getAttribute('data-id'));
      
      if (e.target.checked) {
        selectedSnippets.add(id);
      } else {
        selectedSnippets.delete(id);
      }
      
      updateSelectionUI();
      return;
    }
    
    // 2. Handle Snapshot Image Click - open in new tab
    if (e.target.hasAttribute('data-snapshot-id')) {
      const snapshotId = parseInt(e.target.getAttribute('data-snapshot-id'));
      const { clips } = await chrome.storage.local.get(['clips']);
      const snapshot = clips.find(c => c.timestamp === snapshotId);
      
      if (snapshot && snapshot.imageData) {
        // Open image in new tab
        const win = window.open();
        win.document.write(`
          <html>
            <head>
              <title>Snapshot - ${snapshot.title || 'Untitled'}</title>
              <style>
                body { margin: 0; background: #1f2937; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
                img { max-width: 100%; max-height: 100vh; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
              </style>
            </head>
            <body>
              <img src="${snapshot.imageData}" alt="Snapshot">
            </body>
          </html>
        `);
      }
      return;
    }
    
    // 3. Handle Deletion
    if (e.target.classList.contains('delete-btn')) {
      const idToDelete = parseInt(e.target.getAttribute('data-id'));
      const { clips } = await chrome.storage.local.get(['clips']);
      const updatedClips = (clips || []).filter(c => c.timestamp !== idToDelete);
      await chrome.storage.local.set({ clips: updatedClips });
      
      // Remove from selected snippets if it was selected
      selectedSnippets.delete(idToDelete);
      
      updateUI(); // This now updates badge and list
    }
    
    // 4. Handle Redirect (Click on text)
    if (e.target.classList.contains('clip-text')) {
      const idToFind = parseInt(e.target.getAttribute('data-id'));
      const { clips } = await chrome.storage.local.get(['clips']);
      const clip = (clips || []).find(c => c.timestamp === idToFind);
      
      if (clip) {
        chrome.runtime.sendMessage({ 
          action: "navigateToSource", 
          url: clip.url, 
          text: clip.text 
        });
      }
    }
    
    // 5. Handle URL clicks with scroll-to-text
    if (e.target.classList.contains('clip-url')) {
      e.preventDefault(); // Prevent default link behavior
      const url = e.target.getAttribute('href');
      const idToFind = parseInt(e.target.closest('.clip-item').querySelector('.clip-checkbox').getAttribute('data-id'));
      const { clips } = await chrome.storage.local.get(['clips']);
      const clip = (clips || []).find(c => c.timestamp === idToFind);
      
      if (clip && clip.text) {
        // For text clips, scroll to text
        chrome.runtime.sendMessage({ 
          action: "navigateToSource", 
          url: clip.url, 
          text: clip.text 
        });
      } else {
        // For snapshots, just open the URL
        chrome.tabs.create({ url: url });
      }
    }
  });

  // Add custom tag
  addTagBtn.addEventListener('click', async () => {
    const tagName = newTagInput.value.trim().toLowerCase();
    if (!tagName || !currentSnippetForTag) return;
    
    const { clips } = await chrome.storage.local.get(['clips']);
    const clipIndex = clips.findIndex(c => c.timestamp === currentSnippetForTag);
    
    if (clipIndex !== -1) {
      const existingTags = clips[clipIndex].tags || [];
      if (!existingTags.includes(tagName)) {
        clips[clipIndex].tags = [...existingTags, tagName];
        await chrome.storage.local.set({ clips });
        
        toast.textContent = `Tag #${tagName} added!`;
        toast.style.display = 'block';
        setTimeout(() => toast.style.display = 'none', 1500);
      }
    }
    
    customTagsInput.style.display = 'none';
    newTagInput.value = '';
    currentSnippetForTag = null;
    updateUI();
  });

  cancelTagBtn.addEventListener('click', () => {
    customTagsInput.style.display = 'none';
    newTagInput.value = '';
    currentSnippetForTag = null;
  });

  newTagInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      addTagBtn.click();
    }
  });

  // Folder picker handler
  folderPicker.addEventListener('change', async () => {
    if (folderPicker.value === '__add_new__') {
      newFolderInput.style.display = 'block';
      folderManager.classList.remove('active');
      selectedIcon = '📁'; // Reset to default
      renderIconPicker();
      newFolderName.focus();
      // Reset to previous value temporarily
      const { activeFolder } = await chrome.storage.local.get(['activeFolder']);
      folderPicker.value = activeFolder || 'General';
      return;
    }
    
    if (folderPicker.value === '__manage__') {
      folderManager.classList.toggle('active');
      newFolderInput.style.display = 'none';
      renderFolderManager();
      // Reset to previous value
      const { activeFolder } = await chrome.storage.local.get(['activeFolder']);
      folderPicker.value = activeFolder || 'General';
      return;
    }
    
    folderManager.classList.remove('active');
    newFolderInput.style.display = 'none';
    await chrome.storage.local.set({ activeFolder: folderPicker.value });
    selectedSnippets.clear(); // Clear selections when changing folders
    updateUI();
  });
  
  // Template picker handler
  templatePicker.addEventListener('change', async () => {
    if (templatePicker.value === '__add_new__') {
      customTemplateInput.style.display = 'block';
      templateManager.style.display = 'none';
      templateInputTitle.textContent = 'Create Custom Template';
      templateNameInput.value = '';
      customTemplateArea.value = '';
      currentEditingTemplate = null;
      templateNameInput.focus();
      // Reset to previous value
      const { activeTemplate } = await chrome.storage.local.get(['activeTemplate']);
      templatePicker.value = activeTemplate || 'plain';
      return;
    }
    
    if (templatePicker.value === '__manage__') {
      templateManager.style.display = templateManager.style.display === 'none' ? 'block' : 'none';
      customTemplateInput.style.display = 'none';
      renderTemplateManager();
      // Reset to previous value
      const { activeTemplate } = await chrome.storage.local.get(['activeTemplate']);
      templatePicker.value = activeTemplate || 'plain';
      return;
    }
    
    templateManager.style.display = 'none';
    customTemplateInput.style.display = 'none';
    await chrome.storage.local.set({ activeTemplate: templatePicker.value });
  });

  // Create new folder
  createFolderBtn.addEventListener('click', async () => {
    const folderName = newFolderName.value.trim();
    if (!folderName) return;
    
    // Check if folder already exists
    const exists = customFolders.some(f => f.name === folderName);
    if (exists) {
      toast.textContent = 'Folder already exists!';
      toast.style.background = '#ef4444';
      toast.style.display = 'block';
      setTimeout(() => {
        toast.style.background = '#10b981';
        toast.style.display = 'none';
      }, 1500);
      return;
    }
    
    customFolders.push({ name: folderName, icon: selectedIcon });
    await chrome.storage.local.set({ customFolders, activeFolder: folderName });
    
    updateFolderPicker();
    folderPicker.value = folderName;
    
    toast.textContent = `Folder "${folderName}" created!`;
    toast.style.display = 'block';
    setTimeout(() => toast.style.display = 'none', 1500);
    
    newFolderInput.style.display = 'none';
    newFolderName.value = '';
    selectedIcon = '📁';
    renderIconPicker();
    updateUI();
  });

  // Delete folder handler
  folderList.addEventListener('click', async (e) => {
    if (e.target.classList.contains('delete-folder-btn')) {
      const folderName = e.target.getAttribute('data-folder');
      
      if (confirm(`Delete folder "${folderName}"?\n\nAll snippets in this folder will be moved to General.`)) {
        // Move all clips from this folder to General
        const { clips } = await chrome.storage.local.get(['clips']);
        const updatedClips = (clips || []).map(clip => {
          if (clip.folder === folderName) {
            return { ...clip, folder: 'General' };
          }
          return clip;
        });
        
        // Remove folder from custom folders
        customFolders = customFolders.filter(f => f.name !== folderName);
        
        await chrome.storage.local.set({ clips: updatedClips, customFolders, activeFolder: 'General' });
        
        updateFolderPicker();
        folderPicker.value = 'General';
        renderFolderManager();
        
        toast.textContent = `Folder "${folderName}" deleted!`;
        toast.style.display = 'block';
        setTimeout(() => toast.style.display = 'none', 1500);
        
        updateUI();
      }
    }
  });

  cancelFolderBtn.addEventListener('click', () => {
    newFolderInput.style.display = 'none';
    newFolderName.value = '';
  });

  newFolderName.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      createFolderBtn.click();
    }
  });

  // Search functionality
  searchBox.addEventListener('input', (e) => {
    currentSearchTerm = e.target.value;
    clearSearch.style.display = currentSearchTerm.trim() ? 'block' : 'none';
    updateUI();
  });

  clearSearch.addEventListener('click', () => {
    searchBox.value = '';
    currentSearchTerm = '';
    clearSearch.style.display = 'none';
    updateUI();
  });

  // Listener for background script updates
  chrome.runtime.onMessage.addListener((request) => {
    if (request.action === "refreshUI") {
      updateUI();
    }
  });

  clipBtn.addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab.url.startsWith('http')) return;

    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => window.getSelection().toString()
    }, async (results) => {
      if (!results || !results[0]) return;
      
      const text = results[0].result;
      if (!text || !text.trim()) return;

      const { clips } = await chrome.storage.local.get(['clips']);
      const newClips = clips || [];
      
      // Auto-generate tags for the new clip
      const tags = extractTags(text.trim(), tab.url, tab.title);
      
      newClips.push({
        type: 'text',
        text: text.trim(),
        url: tab.url,
        title: tab.title,
        folder: folderPicker.value,
        timestamp: Date.now(),
        tags: tags
      });
      
      await chrome.storage.local.set({ clips: newClips });
      
      // Wait a bit to ensure storage is updated, then refresh UI
      setTimeout(() => {
        updateUI();
      }, 100);
    });
  });

  // Snapshot button - inject snapshot.js to capture screen area
  snapshotBtn.addEventListener('click', async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab) {
        showToast('No active tab found', 2000);
        return;
      }
      
      if (!tab.url.startsWith('http')) {
        showToast('Cannot capture on this page', 2000);
        return;
      }

      // Inject snapshot script
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content/snapshot.js']
      });

      // Close popup to show the page
      window.close();
    } catch (err) {
      console.error('Snapshot injection error:', err);
      showToast('Failed to start snapshot mode', 2000);
    }
  });

  // Build & Copy Prompt for selected snippets only
  buildPromptBtn.addEventListener('click', async () => {
    if (selectedSnippets.size === 0) return;
    
    const { clips } = await chrome.storage.local.get(['clips']);
    const selectedClips = clips.filter(c => selectedSnippets.has(c.timestamp));
    
    if (selectedClips.length === 0) return;
    
    const templateType = templatePicker.value;
    
    // Format each snippet with the selected template
    const formattedSnippets = selectedClips.map(clip => formatSnippet(clip, templateType));
    
    // Join all formatted snippets
    const prompt = formattedSnippets.join('\n\n' + '='.repeat(50) + '\n\n');
    
    await navigator.clipboard.writeText(prompt);
    
    toast.textContent = `Copied ${selectedClips.length} snippet${selectedClips.length > 1 ? 's' : ''} with ${templateType} format!`;
    toast.style.display = 'block';
    setTimeout(() => toast.style.display = 'none', 2000);
    
    // Clear selections after copying
    selectedSnippets.clear();
    updateUI();
  });

  // Copy all snippets in current folder
  copyBtn.addEventListener('click', async () => {
    const { clips } = await chrome.storage.local.get(['clips']);
    const filtered = (clips || []).filter(c => c.folder === folderPicker.value);
    
    if (filtered.length === 0) return;
    
    const templateType = templatePicker.value;
    
    // Format each snippet with the selected template
    const formattedSnippets = filtered.map(clip => formatSnippet(clip, templateType));
    
    // Join all formatted snippets
    const prompt = formattedSnippets.join('\n\n' + '='.repeat(50) + '\n\n');

    try {
      await navigator.clipboard.writeText(prompt);
      toast.textContent = `All ${filtered.length} snippets copied with ${templateType} format!`;
      toast.style.display = 'block';
      setTimeout(() => toast.style.display = 'none', 2000);
    } catch (err) {
      console.error('Clipboard error:', err);
    }
  });

  clearBtn.addEventListener('click', async () => {
    if (confirm(`Clear all clips in ${folderPicker.value}?`)) {
      const { clips } = await chrome.storage.local.get(['clips']);
      const remainingClips = (clips || []).filter(c => c.folder !== folderPicker.value);
      await chrome.storage.local.set({ clips: remainingClips });
      selectedSnippets.clear(); // Clear selections when clearing folder
      updateUI();
    }
  });

  // Save custom template
  saveTemplateBtn.addEventListener('click', async () => {
    const templateName = templateNameInput.value.trim();
    const templateContent = customTemplateArea.value.trim();
    
    if (!templateName || !templateContent) {
      toast.textContent = 'Template name and content are required!';
      toast.style.background = '#ef4444';
      toast.style.display = 'block';
      setTimeout(() => {
        toast.style.background = '#10b981';
        toast.style.display = 'none';
      }, 1500);
      return;
    }
    
    if (currentEditingTemplate) {
      // Update existing template
      const index = customTemplates.findIndex(t => t.id === currentEditingTemplate);
      if (index !== -1) {
        customTemplates[index] = {
          id: currentEditingTemplate,
          name: templateName,
          content: templateContent
        };
      }
    } else {
      // Create new template
      const newTemplate = {
        id: `custom_${Date.now()}`,
        name: templateName,
        content: templateContent
      };
      customTemplates.push(newTemplate);
    }
    
    await chrome.storage.local.set({ customTemplates });
    updateTemplatePicker();
    
    toast.textContent = currentEditingTemplate ? 'Template updated!' : 'Template created!';
    toast.style.display = 'block';
    setTimeout(() => toast.style.display = 'none', 1500);
    
    customTemplateInput.style.display = 'none';
    currentEditingTemplate = null;
    
    // Set the new/updated template as active
    if (!currentEditingTemplate) {
      const newId = customTemplates[customTemplates.length - 1].id;
      templatePicker.value = newId;
      await chrome.storage.local.set({ activeTemplate: newId });
    }
  });

  // Cancel custom template
  cancelTemplateBtn.addEventListener('click', () => {
    customTemplateInput.style.display = 'none';
    currentEditingTemplate = null;
  });
  
  // Handle template edit/delete
  templateList.addEventListener('click', async (e) => {
    if (e.target.classList.contains('edit-template-btn')) {
      const templateId = e.target.getAttribute('data-id');
      const template = customTemplates.find(t => t.id === templateId);
      
      if (template) {
        customTemplateInput.style.display = 'block';
        templateManager.style.display = 'none';
        templateInputTitle.textContent = 'Edit Template';
        templateNameInput.value = template.name;
        customTemplateArea.value = template.content;
        currentEditingTemplate = templateId;
        templateNameInput.focus();
      }
      return;
    }
    
    if (e.target.classList.contains('delete-template-btn')) {
      const templateId = e.target.getAttribute('data-id');
      const template = customTemplates.find(t => t.id === templateId);
      
      if (template && confirm(`Delete template "${template.name}"?`)) {
        customTemplates = customTemplates.filter(t => t.id !== templateId);
        await chrome.storage.local.set({ customTemplates });
        
        // If deleted template was active, switch to plain
        const { activeTemplate } = await chrome.storage.local.get(['activeTemplate']);
        if (activeTemplate === templateId) {
          await chrome.storage.local.set({ activeTemplate: 'plain' });
          templatePicker.value = 'plain';
        }
        
        updateTemplatePicker();
        renderTemplateManager();
        
        toast.textContent = `Template "${template.name}" deleted!`;
        toast.style.display = 'block';
        setTimeout(() => toast.style.display = 'none', 1500);
      }
    }
  });

  // Listen for storage changes (e.g., when snapshots are saved from content script)
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local' && changes.clips) {
      console.log('Storage changed, refreshing UI');
      updateUI();
    }
  });

  // Initial load
  updateUI();
});