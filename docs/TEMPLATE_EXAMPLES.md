# 📋 Smart Template Injection - Examples

## Available Templates

### 1. 📝 Plain Text
**Use Case:** Simple, unformatted snippet
```
This is my selected text content.
```

---

### 2. 🏷️ XML Context Block
**Use Case:** Structured data for LLMs, reduces hallucination
```xml
<snippet>
  <metadata>
    <source>https://example.com/article</source>
    <title>How to Use Templates</title>
    <timestamp>1/27/2026, 3:45:00 PM</timestamp>
    <tags>tutorial, templates, ai</tags>
  </metadata>
  <content>
This is my selected text content.
  </content>
</snippet>
```

---

### 3. 📄 Markdown Format
**Use Case:** Clean, readable format for documentation
```markdown
### SOURCE
**URL:** https://example.com/article  
**Title:** How to Use Templates  
**Captured:** 1/27/2026, 3:45:00 PM  
**Tags:** tutorial, templates, ai

---

This is my selected text content.

---
```

---

### 4. 💻 Developer Notes
**Use Case:** Code comments format for technical snippets
```javascript
/* DEV NOTE - How to Use Templates */
// Source: https://example.com/article
// Date: 1/27/2026, 3:45:00 PM
// Tags: tutorial, templates, ai

This is my selected text content.

/* END NOTE */
```

---

### 5. 🔬 Research Summary
**Use Case:** Academic or research context
```
📚 RESEARCH EXCERPT

Source: How to Use Templates
Link: https://example.com/article
Date: 1/27/2026, 3:45:00 PM
Categories: tutorial, templates, ai

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

This is my selected text content.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

### 6. ✨ Custom Template
**Use Case:** Create your own format with placeholders

**Available Placeholders:**
- `{{text}}` - The snippet content
- `{{url}}` - Source URL
- `{{title}}` - Page title
- `{{timestamp}}` - When it was captured
- `{{tags}}` - Comma-separated tags

**Example Custom Template:**
```
🎯 CONTEXT SNIPPET
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📍 Source: {{title}}
🔗 Link: {{url}}
⏰ Captured: {{timestamp}}
🏷️ Tags: {{tags}}

📝 Content:
"""
{{text}}
"""

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## How to Use

1. **Select a Template** from the dropdown menu below the folder selector
2. **Clip your snippets** as usual
3. **Select multiple snippets** using checkboxes (or copy all in folder)
4. **Click "Build & Copy Prompt"** - snippets are formatted and copied!

## Why Templates Matter

### ❌ Without Templates (Ambiguous):
```
Here is some text about authentication.
Here is some text about database design.
```
*LLM might confuse sources or invent context*

### ✅ With Templates (Clear):
```xml
<snippet>
  <source>https://auth0.com/docs</source>
  <content>Here is some text about authentication.</content>
</snippet>

<snippet>
  <source>https://mongodb.com/docs</source>
  <content>Here is some text about database design.</content>
</snippet>
```
*LLM clearly knows where each piece came from*

---

## 💡 Tips

- **XML format** is best for complex AI prompts (GPT-4, Claude)
- **Markdown format** is great for sharing in docs/chat
- **Dev Notes** format works well for code-related snippets
- **Custom templates** let you match your workflow exactly
- Templates apply to both **selected snippets** and **copy all**
