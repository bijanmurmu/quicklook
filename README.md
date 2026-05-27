<div align="center">
  
# 🚀 QuickLook
**Universal Text Extractor & AI Toolkit**

Extract links, emails, crypto wallets, and named entities from any text or document—instantly, privately, and 100% in your browser.

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
[![Manifest V3](https://img.shields.io/badge/Chrome-Manifest%20V3-blue)](#)
[![Zero Backend](https://img.shields.io/badge/Privacy-Zero%20Backend-purple)](#)

</div>

---

## 🌟 Features

QuickLook is a completely client-side toolkit that processes everything locally using WebAssembly and JavaScript. Your data never leaves your device.

### 🧠 Advanced AI (NLP)
| Feature | Description |
|---|---|
| **Summarization** | Distills long text into concise summaries using `distilbart-cnn-6-6` |
| **Sentiment Analysis** | Detects Positive, Negative, or Neutral sentiment using `distilbert-base-uncased` |
| **Named Entities (NER)** | Extracts **People**, **Organizations**, **Locations**, and **Misc** entities |

*Note: AI pipelines run via [Transformers.js](https://github.com/xenova/transformers.js). The models (~250MB) are downloaded securely from HuggingFace on first use and permanently cached in your browser's local Cache API.*

### 📄 Universal Document Parsing
| Feature | Description |
|---|---|
| **PDF Extraction** | Drag and drop `.pdf` files. Powered by Mozilla's `pdf.js` |
| **Word Documents** | Drag and drop `.docx` files. Powered by `mammoth.js` |
| **Standard Files** | Supports `.txt`, `.csv`, `.json`, `.md`, and `.html` |

### 🔎 Core Extraction
| Feature | Description |
|---|---|
| **Crypto Wallets** | Automatically finds **BTC** and **ETH** addresses |
| **IP Addresses** | Extracts **IPv4** addresses |
| **Links & Emails** | Standard formats and obfuscated emails (`name [at] domain dot com`) |
| **Phones** | International formats powered by `libphonenumber-js` |
| **Socials & Tags** | Extracts `#tags` and `@handles` |

### ⚡ Quality of Life
- **Live Filtering**: Instantly search and filter across all extracted items.
- **Local History**: Your last 10 sessions are securely saved in `localStorage`.
- **Keyboard Shortcuts**: `Ctrl+K` to search, `Ctrl+H` to restore history, `Ctrl+Enter` to extract.
- **Chrome Extension**: Highlight text on any page -> right-click -> **"Extract with QuickLook"**.

---

## 🚀 Getting Started

### As a Web App (Local Development)

```bash
# 1. Clone the repository
git clone https://github.com/bijanmurmu/quicklook.git
cd quicklook

# 2. Install dependencies
npm install

# 3. Build the local vendor bundle (CRITICAL)
npm run vendor:build

# 4. Start the local server
npx serve .
```

> **Note:** The `vendor/` directory is ignored by Git. You must run `npm run vendor:build` after cloning to bundle the AI pipelines and PDF parsers!

### As a Chrome Extension

1. Clone and install dependencies as above.
2. Open Chrome and navigate to `chrome://extensions/`.
3. Enable **Developer mode** (top right).
4. Click **Load unpacked** and select the `quicklook/` directory.

---

## 🛠️ Architecture (Zero-Backend)

QuickLook embraces a strict zero-backend philosophy:
- **UI & Logic:** Vanilla HTML/CSS/JS (`script.js`) for maximum performance and extension compatibility.
- **Workers:** AI inferences are offloaded to Web Workers (`ner-worker.js`) so the UI never freezes.
- **Dependencies:** All external libraries (Lucide, PDF.js, Transformers.js) are bundled into the `vendor/` folder via `npm run vendor:build` so the Chrome extension can run entirely offline without violating CSP rules.

---

## 🤝 Contributing

We welcome contributions! Whether it's adding new regex extractors, improving the UI, or fixing bugs, we'd love your help.

Please read our [Contributing Guidelines](CONTRIBUTING.md) and our [Code of Conduct](CODE_OF_CONDUCT.md) before submitting a Pull Request.

---

## 🔒 Security & Privacy

QuickLook processes all text locally. If you discover a security vulnerability, please refer to our [Security Policy](SECURITY.md) to report it confidentially.

---

## 📜 License

[MIT](LICENSE) © Bijan Murmu