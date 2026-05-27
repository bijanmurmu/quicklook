# Contributing to QuickLook

First off, thank you for considering contributing to QuickLook! It's people like you that make QuickLook such a great tool.

## Development Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/bijanmurmu/quicklook.git
   cd quicklook
   ```

2. **Install Dependencies:**
   QuickLook relies on some external modules (like PDF.js and Transformers.js) that are bundled locally to ensure a privacy-first, zero-backend experience.
   ```bash
   npm install
   ```

3. **Build the Vendor Bundle:**
   Before running the extension or testing the web page, you must run the build script to populate the `vendor/` directory with the necessary local dependencies.
   ```bash
   npm run vendor:build
   ```

4. **Testing Locally:**
   Simply open `index.html` in your browser, or start a local server:
   ```bash
   npx serve .
   ```

## Loading as a Chrome Extension

1. Open Chrome and navigate to `chrome://extensions/`.
2. Enable **Developer mode** in the top right.
3. Click **Load unpacked** and select the `quicklook` repository folder.

## Submitting Changes

1. **Fork** the repository and create your branch from `main`.
2. **Commit** your changes with descriptive messages following Conventional Commits (e.g., `feat: added new extractor`).
3. **Ensure** you have run `npm run vendor:build` if you added new dependencies, but *do not commit* the `vendor/` folder as it is gitignored.
4. Open a **Pull Request** and describe the changes you made.

## Code Style

- Enforce standard formatting. We use `.editorconfig` to maintain consistency.
- Keep the zero-backend philosophy: All processing must occur strictly on the client side. No external API calls are allowed for data processing.
