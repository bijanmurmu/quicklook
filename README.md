# 🔍 QuickLook — Universal Text Extractor & Chrome Extension

> Extract links, emails, phone numbers, hashtags, social profiles and named entities from any text — instantly, privately, and entirely in your browser.

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
![Manifest V3](https://img.shields.io/badge/Chrome-Manifest%20V3-blue)
![Tests](https://img.shields.io/badge/tests-8%20passing-brightgreen)

---

## ✨ Features

### Core Extraction
| Feature | Description |
|---|---|
| 🔗 **Links** | Finds all URLs including `www.` prefixed links |
| 📧 **Emails** | Standard formats **and** obfuscated ones (`name [at] domain dot com`) |
| 📞 **Phone Numbers** | International formats powered by `libphonenumber-js` |
| #️⃣ **Hashtags** | Extracts `#tags` from social-style content |
| 👥 **Social Profiles** | `twitter.com/`, `x.com/`, `linkedin.com/in/`, `instagram.com/`, `@handles` |
| 🔑 **Top Keywords** | Most frequent meaningful words (stopwords filtered) |

### AI-Powered (Phase 3)
| Feature | Description |
|---|---|
| 🧠 **Named Entity Recognition** | Extracts **People**, **Organizations**, and **Locations** using an in-browser BERT model via [Transformers.js](https://github.com/xenova/transformers.js) — 100% local, zero data sent anywhere |

### Quality of Life
| Feature | Description |
|---|---|
| 🎨 **Live Highlighting** | Matches are colour-coded in the textarea as you type — blue for URLs, red for emails, green for hashtags, purple for @handles |
| ✨ **Format Toggle** | Normalises phone numbers to international format and upgrades `http://` → `https://` |
| 🌙 **Dark / Light Mode** | Theme persists across sessions via `localStorage` |
| 📁 **Drag & Drop** | Drop `.txt`, `.csv`, `.json`, `.md`, `.html` files directly onto the page |
| 📋 **Auto-Extract on Paste** | Optional toggle that runs extraction the moment you paste |
| 📥 **Export** | Download all results as **JSON** or **CSV** |
| ⌨️ **Keyboard Shortcut** | `Ctrl/Cmd + Enter` to extract |

### Chrome Extension (Phase 1)
| Feature | Description |
|---|---|
| 🖱️ **Context Menu** | Highlight text on any webpage → right-click → **"Extract with QuickLook"** → open popup to see results instantly |
| 🔔 **Badge Indicator** | Extension icon shows a badge when context-menu text is waiting |
| 🔒 **Privacy-First** | Only `contextMenus` and `storage` permissions — no host permissions, no network requests |

---

## 🚀 Getting Started

### As a Web App

```bash
git clone https://github.com/bijanmurmu/quicklook.git
cd quicklook
npm install
npm run vendor:build   # copies Lucide, libphonenumber-js, Transformers.js to vendor/
npm start              # opens http://127.0.0.1:5500
```

### As a Chrome Extension

1. Clone and install as above
2. Open Chrome → `chrome://extensions/`
3. Enable **Developer mode** (top right toggle)
4. Click **Load unpacked** → select the `quicklook/` folder
5. Pin the QuickLook icon to your toolbar

> **Note:** The `vendor/` directory is excluded from git (`.gitignore`). Always run `npm run vendor:build` after a fresh clone.

---

## 🛠️ Developer Workflow

```bash
npm install            # install all dev dependencies
npm run vendor:build   # regenerate vendor/ bundles from node_modules
npm test               # run Jest test suite (8 tests)
npm run lint           # ESLint
npm run format         # Prettier
npm start              # local HTTP server on port 5500
```

### Running Tests

```
PASS tests/extract.test.js
  extract()
    ✓ extracts urls, emails, phones, hashtags, socials and keywords
    ✓ extracts obfuscated emails
    ✓ extracts international phones using libphonenumber-js
    ✓ extracts social media links
    ✓ handles empty input
    ✓ deduplicates results
  getTopKeywords()
    ✓ returns most frequent words
  sanitizeUrl()
    ✓ prefixes www with http

Tests: 8 passed, 8 total
```

---

## 📁 Project Structure

```
quicklook/
├── index.html              # Main UI (also the Extension popup)
├── script.js               # All browser logic (Phases 1-4)
├── style.css               # Design system & styles
├── background.js           # Extension service worker (context menu)
├── ner-worker.js           # Web Worker for NER (Transformers.js)
├── manifest.json           # Chrome Extension Manifest V3
├── src/
│   └── extract.js          # Pure extraction functions (ESM, for testing)
├── tests/
│   └── extract.test.js     # Jest test suite
├── vendor/                 # ⚠️ git-ignored — run npm run vendor:build
│   ├── lucide.min.js
│   ├── libphonenumber-min.js
│   └── transformers.min.js
└── assets/                 # Icons and images
```

---

## 🔒 Privacy

QuickLook is **zero-backend**. Every feature — including the AI Named Entity Recognition — runs entirely in your browser using WebAssembly. No text you paste is ever sent to a server.

The only external network request made is the **one-time download** of the BERT NER model (~80 MB) from Hugging Face on first use. The model is then cached locally in your browser's IndexedDB and never downloaded again.

---

## 📜 License

[MIT](LICENSE) © Bijan Murmu