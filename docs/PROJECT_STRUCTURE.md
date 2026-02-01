# PromptClip Pro - Project Structure

## 📁 Directory Organization

```
ContextClipper/
│
├── manifest.json                    # Extension configuration & permissions
├── README.md                        # Main documentation
│
├── images/                          # Extension icons & assets
│   ├── icon-16.png                 # Toolbar icon (16×16)
│   ├── icon-48.png                 # Extension management (48×48)
│   └── icon-128.png                # Chrome Web Store (128×128)
│
├── popup/                           # User Interface
│   ├── popup.html                  # Main popup UI (HTML + inline CSS)
│   ├── popup.js                    # UI logic, state management, templates
│   └── help.html                   # User guide (opens in new tab)
│
├── background/                      # Service Worker (Background Scripts)
│   └── background.js               # Event handling, context menus, messages
│
├── content/                         # Content Scripts (Injected into pages)
│   └── snapshot.js                 # Screenshot overlay & area selection
│
└── docs/                            # Additional Documentation
    ├── STYLING_UPDATE.md           # UI/UX changelog
    ├── TEMPLATE_EXAMPLES.md        # Template usage examples
    └── UPDATE_SUMMARY.md           # Feature updates log
```

## 📄 File Descriptions

### Root Level

**manifest.json**
- Extension metadata (name, version, description)
- Required permissions (storage, activeTab, scripting, etc.)
- Icon references
- Background service worker registration
- Popup HTML reference
- Keyboard shortcuts

**README.md**
- Project overview and features
- Installation instructions
- Usage guide
- Development setup
- Troubleshooting

---

### `/images` - Icons & Assets

**icon-16.png** - 16×16 pixels
- Shown in browser toolbar
- Shown in extension list

**icon-48.png** - 48×48 pixels
- Shown in extension management page
- Used in notifications

**icon-128.png** - 128×128 pixels
- Chrome Web Store listing
- Extension details page

---

### `/popup` - User Interface

**popup.html** (368 lines)
- Main extension popup interface
- Inline CSS styles (root variables, components)
- UI elements:
  - Folder picker dropdown
  - Template selector
  - Search box with clear button
  - Clip/Snapshot action buttons
  - Clip list with checkboxes
  - Tag management
  - Build & Copy controls
  - Toast notifications
- References: `popup.js`

**popup.js** (1,232 lines)
- Core application logic
- State management:
  - Selected snippets tracking
  - Current search term
  - Custom folders & templates
- Event handlers:
  - Clip button (text selection)
  - Snapshot button (inject content script)
  - Template management (CRUD)
  - Folder management (CRUD)
  - Tag management
  - Build & copy prompt
  - Search & filter
- Chrome APIs:
  - `chrome.storage.local` - persist clips, folders, templates
  - `chrome.tabs` - get current tab info
  - `chrome.scripting` - inject snapshot script
  - `chrome.runtime` - messaging
- Template system with variable substitution
- Token counter estimation
- UI update & rendering logic

**help.html**
- Standalone user guide page
- Opens in new browser tab
- Comprehensive feature documentation
- No external dependencies
- Clean, readable design

---

### `/background` - Service Worker

**background.js** (436 lines)
- Runs in the background (persistent)
- Event listeners:
  - `chrome.runtime.onInstalled` - setup context menu
  - `chrome.contextMenus.onClicked` - right-click actions
  - `chrome.runtime.onMessage` - handle messages from popup/content
  - `chrome.commands.onCommand` - keyboard shortcuts (Ctrl+Shift+X)
- Functions:
  - `saveClip()` - save text clip to storage
  - `captureSnapshot()` - screenshot visible tab
  - Message handlers:
    - "getClipCount" - badge count
    - "captureSnapshot" - initiate screenshot
    - "updateBadge" - update extension icon badge
- Scroll-to-text functionality
- Badge count updates

---

### `/content` - Content Scripts

**snapshot.js** (284 lines)
- Injected into active tab when snapshot mode starts
- Creates overlay UI:
  - Dark semi-transparent background
  - Selection box (dotted border)
  - Instructions panel
- Mouse event handlers:
  - `mousedown` - start selection
  - `mousemove` - update selection box
  - `mouseup` - end selection & capture
- Keyboard handler:
  - `ESC` - cancel snapshot mode
- Cropping logic:
  - Canvas-based image cropping
  - Device pixel ratio support (HiDPI/Retina)
  - Preserves image quality
- Chrome messaging:
  - Sends capture request to background
  - Receives screenshot data
  - Crops to selected area
  - Saves to storage
- Cleanup & prevention of duplicate injection

---

### `/docs` - Documentation

**STYLING_UPDATE.md**
- UI/UX improvement changelog
- Design decisions
- CSS modifications
- Visual polish notes

**TEMPLATE_EXAMPLES.md**
- Template usage examples
- Variable reference
- Custom template ideas
- Best practices

**UPDATE_SUMMARY.md**
- Feature update history
- Bug fixes
- Breaking changes
- Migration notes

---

## 🔄 Data Flow

### Text Clipping Flow
```
1. User selects text on webpage
2. User clicks extension icon
3. popup.js gets selected text
4. Retrieves current tab info (URL, title)
5. Saves to chrome.storage.local with metadata
6. Updates UI and badge count
```

### Snapshot Capture Flow
```
1. User clicks 📸 Snapshot button in popup
2. popup.js injects content/snapshot.js into active tab
3. Popup closes, showing page
4. snapshot.js creates overlay UI
5. User drags to select area
6. snapshot.js sends area coordinates to background
7. background.js captures visible tab (screenshot)
8. background.js sends screenshot to snapshot.js
9. snapshot.js crops image using canvas
10. Saves cropped image to chrome.storage.local
11. Cleans up overlay and closes
```

### Template Building Flow
```
1. User selects clips via checkboxes
2. User selects template from dropdown
3. User clicks "Build & Copy"
4. popup.js retrieves selected clips
5. Retrieves template definition
6. Replaces variables: {text}, {url}, {title}, etc.
7. Concatenates all clips with template
8. Copies to clipboard
9. Shows toast notification
```

---

## 🔧 Key Technologies

| Technology | Usage |
|------------|-------|
| **Manifest V3** | Modern extension architecture |
| **Service Worker** | Background event handling |
| **Content Scripts** | Page interaction |
| **Chrome Storage API** | Local data persistence |
| **Canvas API** | Image cropping |
| **Clipboard API** | Copy functionality |
| **Chrome Tabs API** | Tab information |
| **Chrome Scripting API** | Dynamic script injection |

---

## 📊 Storage Schema

### Clips Array
```javascript
{
  clips: [
    {
      type: 'text' | 'snapshot',
      text: string,              // for text clips
      imageData: string,         // for snapshots (base64 data URL)
      width: number,             // snapshot dimensions
      height: number,
      url: string,
      title: string,
      folder: string,
      tags: string[],
      timestamp: number
    }
  ]
}
```

### Folders Array
```javascript
{
  folders: [
    {
      name: string,
      icon: string
    }
  ]
}
```

### Templates Array
```javascript
{
  templates: [
    {
      name: string,
      template: string
    }
  ]
}
```

---

## 🚀 Extension Lifecycle

### Installation
1. User installs extension
2. `chrome.runtime.onInstalled` fires
3. Creates context menu: "Clip Selection"
4. Sets up default folders/templates

### Daily Usage
1. User browses websites
2. Clips text or captures snapshots
3. Data saved to `chrome.storage.local`
4. Badge shows clip count

### Building Prompts
1. User opens popup
2. Selects clips
3. Chooses template
4. Builds & copies formatted prompt
5. Pastes into AI chat

---

## 📝 Development Notes

### Adding Features
- UI changes → `popup/popup.html` and `popup/popup.js`
- Background tasks → `background/background.js`
- Page interactions → `content/snapshot.js` or new content script
- Icons → `images/` (ensure 16, 48, 128 sizes)
- Documentation → `docs/` or update `README.md`

### Testing Changes
1. Edit source files
2. Go to `chrome://extensions/`
3. Click reload on PromptClip Pro
4. Test functionality

### Debugging
- Popup: Right-click → Inspect
- Background: Click "service worker" in extension details
- Content scripts: Use page DevTools console
- Storage: Application tab → Extension Storage

---

*Last updated: January 2026*
