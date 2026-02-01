# PromptClip Pro 📚

> **Your AI-powered context clipboard for building better prompts**

PromptClip Pro is a Chrome extension that helps you collect, organize, and format text and visual content from web pages to build comprehensive prompts for AI conversations with ChatGPT, Claude, and other AI assistants.

<img width="444" height="417" alt="image" src="https://github.com/user-attachments/assets/12a0abc3-7421-4318-b9b6-c579c21a6156" />

## ✨ Features

### 📝 Content Capture
- **Text Clips**: Select text on any webpage and save it with one click
- **Visual Snapshots**: Capture screenshots of specific screen areas with drag-to-select
- **Auto-Context**: Automatically saves URL, title, and timestamp with each clip

### 📁 Organization
- **Custom Folders**: Create and organize clips into folders with custom icons
- **Smart Tags**: Add custom tags to clips for better categorization
- **Full-Text Search**: Search across all clips by content, tags, titles, or URLs
- **Token Counter**: Real-time token estimation for AI model limits

### ✨ Templates
- **Pre-built Templates**: Plain, Markdown, Dev Notes, Research formats
- **Custom Templates**: Create your own templates with variables:
  - `{text}` - Clipped content
  - `{url}` - Source URL
  - `{title}` - Page title
  - `{tags}` - Comma-separated tags
  - `{timestamp}` - Creation timestamp
  - `{folder}` - Folder name

### 🚀 Workflow
1. **Collect**: Clip text and snapshots while browsing
2. **Organize**: Sort into folders and add tags
3. **Build**: Select clips and choose a template
4. **Copy**: One-click copy formatted prompt to clipboard
5. **Paste**: Use in ChatGPT, Claude, or any AI chat

## 📦 Installation

### From Source
1. Clone or download this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" (top right)
4. Click "Load unpacked"
5. Select the `ContextClipper` folder
6. The extension icon will appear in your toolbar

### From Chrome Web Store
*(Coming soon)*

## 🎯 Quick Start

### Capturing Text
1. Select text on any webpage
2. Click the PromptClip Pro extension icon
3. Text is saved to your current folder

### Capturing Snapshots
1. Click the extension icon
2. Click the **📸 Snapshot** button
3. Drag to select screen area
4. Release to capture (or press ESC to cancel)

### Building Prompts
1. Select clips using checkboxes
2. Choose a template from dropdown
3. Click **✨ Build & Copy**
4. Paste into your AI chat


## 🔑 Keyboard Shortcuts

- **Ctrl+Shift+X** (Windows/Linux) or **Cmd+Shift+X** (Mac): Clip current selection
- **ESC**: Cancel snapshot selection



## 🎨 Customization

### Creating Custom Templates
1. Click the template dropdown
2. Select "➕ New Template..."
3. Name your template
4. Use variables: `{text}`, `{url}`, `{title}`, `{tags}`, `{timestamp}`, `{folder}`
5. Save and use immediately

### Creating Custom Folders
1. Click the folder dropdown
2. Select "➕ New Folder..."
3. Choose an icon
4. Name your folder
5. Start organizing!


## 🔧 Technical Details

### Technologies
- **Manifest V3**: Modern Chrome extension architecture
- **Service Worker**: Background event handling
- **Content Scripts**: Page interaction for snapshots
- **Chrome Storage API**: Local data persistence

### Permissions
- `storage`: Save clips and settings locally
- `activeTab`: Access current page content
- `scripting`: Inject snapshot overlay
- `contextMenus`: Right-click menu options
- `notifications`: Status notifications

### Storage
All data is stored **locally** using `chrome.storage.local`:
- Typical limit: 5-10MB
- No external servers
- Complete privacy
- Export via "Copy All in Folder"

## 📂 Project Structure

```
ContextClipper/
├── manifest.json           # Extension configuration
├── README.md              # This file
├── images/                # Extension icons
│   ├── icon-16.png
│   ├── icon-48.png
│   └── icon-128.png
├── popup/                 # Extension UI
│   ├── popup.html        # Main popup interface
│   ├── popup.js          # UI logic and state management
│   └── help.html         # User guide page
├── background/            # Service worker
│   └── background.js     # Background tasks, context menus
├── content/               # Content scripts
│   └── snapshot.js       # Screen capture overlay
└── docs/                  # Documentation
    ├── STYLING_UPDATE.md
    ├── TEMPLATE_EXAMPLES.md
    └── UPDATE_SUMMARY.md
```

## 💡 Use Cases

### For Developers
- Collect code snippets and documentation
- Save error messages and stack traces
- Build comprehensive bug reports
- Create technical prompts for AI coding assistants

### For Researchers
- Gather quotes and citations
- Capture charts and diagrams
- Organize research by topic
- Build literature review prompts

### For Writers
- Collect inspiration and references
- Save examples and templates
- Organize by project or theme
- Generate content briefs

### For Students
- Save lecture notes and materials
- Collect study resources
- Organize by subject
- Create comprehensive study prompts

## 🛠️ Development

### Building from Source
```bash
# No build step required - it's pure HTML/CSS/JS
# Just load the extension folder in Chrome
```

### File Modifications
- **UI Changes**: Edit `popup/popup.html` and `popup/popup.js`
- **Background Tasks**: Edit `background/background.js`
- **Snapshot Feature**: Edit `content/snapshot.js`
- **Styles**: Inline in `popup/popup.html`

### Testing
1. Make changes to source files
2. Go to `chrome://extensions/`
3. Click reload icon on PromptClip Pro card
4. Test in extension popup


## 🐛 Troubleshooting

### Snapshots not working?
- Ensure you clicked the 📸 button in the popup
- Check that the page allows content scripts
- Some pages (chrome://, file://) don't allow extensions

### Data disappeared?
- Check if you're in the correct folder
- Use search to find clips
- Data is stored per browser profile

### Extension not loading?
- Check for errors in `chrome://extensions/`
- Ensure all file paths are correct
- Try reloading the extension

## 🤝 Contributing

Contributions welcome! Areas for improvement:
- Export/import functionality
- Cloud sync options
- Additional template variables
- More customization options
- Accessibility improvements

## 📄 License

MIT License - feel free to modify and distribute

## 🔗 Links

- [User Guide](popup/help.html)
- [Template Examples](docs/TEMPLATE_EXAMPLES.md)
- [Styling Updates](docs/STYLING_UPDATE.md)

## 💬 Support

For issues, suggestions, or questions:
- Open an issue on GitHub
- Check the built-in help guide (ℹ️ button)
- Review documentation in `/docs`

---

**Built with ❤️ for AI-powered workflows**

*Enhance your AI conversations with rich context* 🚀
