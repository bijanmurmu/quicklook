# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-05-27

### Added
- **AI NLP Pipelines**: Fully local Text Summarization (`Xenova/distilbart-cnn-6-6`) and Sentiment Analysis (`Xenova/distilbert-base-uncased-finetuned-sst-2-english`) via Web Workers.
- **Universal Document Parsing**: Drag-and-drop support for parsing raw text from `.pdf` (using `pdf.js`) and `.docx` (using `mammoth.js`) files.
- **New Regex Extractors**: Support for extracting Crypto Wallets (BTC, ETH) and IPv4 Addresses.
- **Local History**: Extracted text sessions are securely cached in `localStorage` for easy restoration.
- **Live Filtering**: Fast text-based filtering UI to instantly search across all extracted items.
- **Keyboard Shortcuts**: Added `Ctrl+K` to focus the search bar and `Ctrl+H` to restore previous history.
- **Community Standards**: Added `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`, and Issue/PR templates to transition to a professional open-source project.

### Changed
- Reverted category header icons to colorful emojis (`🔗`, `📧`, `🧠`) while keeping Lucide SVGs for popup toast alerts.
- Enforced a pure Dark Theme for all users and removed the light theme toggle.
- Upgraded the deployment workflow to automatically bundle the `vendor/` directory and deploy newly added models via GitHub Actions.

### Fixed
- Resolved MV3 CSP inline event handler violations preventing extension execution.
- Handled Cache API fallback gracefully in `ner-worker` to support Incognito/restricted environments.
- Prevented the NER "Entities" section from completely vanishing on clear or empty results.
- Fixed an accidental `formattingEnabled` double declaration syntax error.
