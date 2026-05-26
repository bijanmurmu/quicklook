# 🔍 QuickLook – Universal Text & Link Extractor

A minimal web tool to instantly extract:

- 🔗 Links
- 📧 Emails
- 📞 Phone Numbers
- 📄 Top Keywords

Paste any text, and instantly extract the essentials!

---

## 🚀 Features

- **Extract Links:** Finds and lists all URLs in your text.
- **Extract Emails:** Detects and displays all email addresses.
- **Extract Phone Numbers:** Pulls out phone numbers in common formats.
- **Top Keywords:** Shows the most frequent words (excluding common stopwords).
- **Copy Buttons:** Easily copy any extracted item with a single click.
- **Responsive UI:** Clean, modern interface that works on any device.
- **No Dependencies:** Pure HTML, CSS, and JavaScript—no frameworks required.

New in this version:
- **Export:** Download results as JSON or CSV.
- **Clear:** Quickly clear input and results.
- **Accessibility:** ARIA attributes, keyboard support (Ctrl/Cmd+Enter to extract), and improved focus management.

---

## 🛠️ Getting Started

### 1. Clone this repository

```bash
git clone https://github.com/bijanmurmu/quicklook.git
cd quicklook
```

### 2. Open the App

Just open `index.html` in your browser—no build steps or server needed.

### Developer setup (Phase B)

1. Install dev dependencies:

```bash
npm install
```

2. Run tests:

```bash
npm test
```

3. Start a quick local server (uses `http-server` via `npx`):

```bash
npm start
# then open http://127.0.0.1:5500/
```

4. Lint and format:

```bash
npm run lint
npm run format
```

---

## ✨ Usage

1. **Paste** or type any text into the input area.
2. **Click "Extract"** to see links, emails, phone numbers, and keywords.
3. **Copy** any result using the copy button next to each item.