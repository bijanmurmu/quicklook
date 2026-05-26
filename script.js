/* ========================================================================
   QuickLook — Main Application Script
   Extraction logic inlined for browser use (file:// & static server compat).
   ======================================================================== */

// ── Extraction Logic ────────────────────────────────────────────────────

function sanitizeUrl(u) {
  if (!u) return u;
  if (/^www\./i.test(u)) return 'http://' + u;
  return u;
}

function getTopKeywords(text, limit = 10) {
  if (!text) return [];
  const stop = new Set([
    'this', 'that', 'with', 'from', 'your', 'have', 'which',
    'about', 'there', 'their', 'they', 'been', 'were', 'will',
    'would', 'could', 'should', 'does', 'than', 'then', 'into',
    'just', 'also', 'more', 'some', 'only', 'other', 'when',
  ]);
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 3 && !stop.has(w));

  const freq = {};
  words.forEach(w => (freq[w] = (freq[w] || 0) + 1));
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(e => e[0]);
}

function extractLib(text) {
  const safeText = text || '';
  const urlRe = /((?:https?:\/\/|www\.)[^\s"'<>)]+)/gim;
  
  // Advanced obfuscated email regex
  const emailRe = /\b[A-Za-z0-9._%+-]+(?:\s*(?:@|\[at\]|\(at\)|AT)\s*)[A-Za-z0-9.-]+(?:\s*(?:\.|\[dot\]|\(dot\)|DOT)\s*)[A-Za-z]{2,}\b/gi;
  
  // Social media regex
  const socialRe = /(?:https?:\/\/)?(?:www\.)?(twitter\.com\/[A-Za-z0-9_]+|x\.com\/[A-Za-z0-9_]+|instagram\.com\/[A-Za-z0-9_.-]+|linkedin\.com\/in\/[A-Za-z0-9_-]+)|(?<=^|\s)@([A-Za-z0-9_]+)\b/gi;

  const hashtagRe = /#[A-Za-z][A-Za-z0-9_]{1,}/g;

  // Process URLs
  const urls = [...new Set([...safeText.matchAll(urlRe)].map(m => sanitizeUrl(m[0])))];
  
  // Process Emails (De-obfuscate)
  const emailsRaw = [...safeText.matchAll(emailRe)].map(m => m[0]);
  const emails = [...new Set(emailsRaw.map(e => e.replace(/\s*(?:\[at\]|\(at\)|AT)\s*/i, '@').replace(/\s*(?:\[dot\]|\(dot\)|DOT)\s*/i, '.').toLowerCase()))];
  
  // Process Phones
  let phones = [];
  if (typeof libphonenumber !== 'undefined' && libphonenumber.findNumbers) {
    const found = libphonenumber.findNumbers(safeText, 'US', { v2: true });
    phones = [...new Set(found.map(i => i.number.number || i.number))];
  } else {
    const phoneRe = /\b(?:\+?\d{1,3}[ .-]?)?(?:\(?\d{1,4}\)?[ .-]?)?\d{1,4}[ .-]?\d{1,4}(?:[ .-]?\d{1,9})?\b/g;
    phones = [...new Set([...safeText.matchAll(phoneRe)].map(m => m[0]).filter(p => p.replace(/\D/g, '').length >= 7))];
  }

  // Process Socials
  const socials = [...new Set([...safeText.matchAll(socialRe)].map(m => m[0].trim()))];

  const hashtags = [...new Set([...safeText.matchAll(hashtagRe)].map(m => m[0]))];
  const keywords = getTopKeywords(safeText, 10);

  return { urls, emails, phones, socials, keywords, hashtags };
}

// ── Section State Management ────────────────────────────────────────────

const SECTIONS = ['links', 'emails', 'phones', 'hashtags', 'socials', 'keywords'];

function updateSectionStates() {
  SECTIONS.forEach(id => {
    const ul = document.querySelector(`#${id} ul`);
    const section = document.getElementById(id);
    if (!ul || !section) return;
    const items = [...ul.querySelectorAll('li:not(.empty-item)')];
    const countEl = section.querySelector('.count');
    if (countEl) countEl.textContent = items.length ? items.length : '';
    if (!items.length) {
      section.classList.add('empty');
    } else {
      section.classList.remove('empty');
    }
  });
}

// ── UI Helpers ──────────────────────────────────────────────────────────

function getText() {
  return document.getElementById('inputText').value || '';
}

async function extractText() {
  const text = getText();
  if (!text.trim()) {
    showToast('⚠️ Please enter some text first');
    return;
  }

  const { urls, emails, phones, socials, keywords, hashtags } = extractLib(text);

  fillList('links', urls, true, true);
  fillList('emails', emails, true, true);
  fillList('phones', phones, true, true);
  fillList('hashtags', hashtags, true, false);
  fillList('socials', socials, true, true);
  fillList('keywords', keywords, false, false);

  const results = document.getElementById('results');
  if (results) results.focus();
  updateSectionStates();

  if (window.lucide) {
    lucide.createIcons();
  }

  const total = urls.length + emails.length + phones.length + socials.length + hashtags.length + keywords.length;
  showToast(`✅ Extracted ${total} items`);
}

// ── Clipboard ───────────────────────────────────────────────────────────

function writeToClipboard(text) {
  if (!text) return Promise.resolve();
  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(text);
  }
  return new Promise((resolve, reject) => {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      if (ok) resolve();
      else reject(new Error('execCommand copy failed'));
    } catch (e) {
      reject(e);
    }
  });
}

// ── List Rendering ──────────────────────────────────────────────────────

function fillList(id, items, copyable = false, makeClickable = false) {
  const ul = document.querySelector(`#${id} ul`);
  if (!ul) return;
  ul.innerHTML = '';

  if (!items || items.length === 0) {
    const li = document.createElement('li');
    li.className = 'empty-item';
    li.textContent = `No ${id} found`;
    ul.appendChild(li);
    return;
  }

  items.forEach((item, index) => {
    const li = document.createElement('li');
    li.style.animationDelay = `${index * 0.04}s`;

    const content = document.createElement(makeClickable ? 'a' : 'span');
    if (makeClickable) {
      content.setAttribute('href', item);
      content.textContent = item;
      content.target = '_blank';
      content.rel = 'noopener noreferrer';
    } else {
      content.textContent = item;
    }
    li.appendChild(content);

    if (copyable) {
      const btn = document.createElement('button');
      btn.className = 'copy-btn';
      btn.type = 'button';
      btn.setAttribute('aria-label', `Copy ${item}`);
      btn.innerHTML = '<i data-lucide="copy"></i>';

      btn.addEventListener('click', async () => {
        try {
          await writeToClipboard(item);
          btn.innerHTML = '<i data-lucide="check"></i>';
          if (window.lucide) lucide.createIcons({ root: btn });
          
          showToast(`📋 Copied: ${item.length > 40 ? item.substring(0, 40) + '…' : item}`);
          setTimeout(() => {
            btn.innerHTML = '<i data-lucide="copy"></i>';
            if (window.lucide) lucide.createIcons({ root: btn });
          }, 1200);
        } catch (e) {
          showToast('❌ Copy failed');
          console.warn('Clipboard write failed', e);
        }
      });

      li.appendChild(btn);
    }

    ul.appendChild(li);
  });
}

// ── Clear ───────────────────────────────────────────────────────────────

function clearAll() {
  document.getElementById('inputText').value = '';
  SECTIONS.forEach(id => {
    const ul = document.querySelector(`#${id} ul`);
    if (ul) ul.innerHTML = '';
    const section = document.getElementById(id);
    if (section) section.classList.add('empty');
    const countEl = section && section.querySelector('.count');
    if (countEl) countEl.textContent = '';
  });
  updateCounter();
  showToast('🧹 Cleared');
}

// ── Export ───────────────────────────────────────────────────────────────

function exportJSON() {
  const data = collectResults();
  const hasData = Object.values(data).some(arr => arr.length > 0);
  if (!hasData) {
    showToast('⚠️ Nothing to export');
    return;
  }
  download(JSON.stringify(data, null, 2), 'quicklook-results.json', 'application/json');
  showToast('📥 Exported as JSON');
}

function exportCSV() {
  const data = collectResults();
  const hasData = Object.values(data).some(arr => arr.length > 0);
  if (!hasData) {
    showToast('⚠️ Nothing to export');
    return;
  }
  let csv = 'category,value\n';
  Object.keys(data).forEach(cat => {
    data[cat].forEach(v => {
      csv += `${escapeCsv(cat)},${escapeCsv(v)}\n`;
    });
  });
  download(csv, 'quicklook-results.csv', 'text/csv');
  showToast('📥 Exported as CSV');
}

function copySection(id) {
  const items = [...document.querySelectorAll(`#${id} ul li:not(.empty-item)`)]
    .map(li => li.textContent)
    .filter(t => t);
  if (!items.length) {
    showToast('⚠️ Nothing to copy');
    return;
  }
  const text = items.join('\n');
  writeToClipboard(text).then(() => {
    const section = document.getElementById(id);
    const btn = section && section.querySelector('.section-copy');
    if (btn) {
      const old = btn.textContent;
      btn.textContent = '✓ Copied';
      setTimeout(() => (btn.textContent = old), 1500);
    }
    showToast(`📋 Copied ${items.length} ${id}`);
  }).catch(e => {
    showToast('❌ Copy failed');
    console.warn('Copy failed', e);
  });
}

function escapeCsv(s) {
  if (s == null) return '';
  const str = String(s).replace(/"/g, '""');
  return `"${str}"`;
}

function collectResults() {
  const read = id => [...document.querySelectorAll(`#${id} ul li:not(.empty-item)`)]
    .map(li => li.textContent)
    .filter(t => t);
  return {
    links: read('links'),
    emails: read('emails'),
    phones: read('phones'),
    hashtags: read('hashtags'),
    keywords: read('keywords'),
  };
}

function download(content, filename, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// ── Toast Notifications ─────────────────────────────────────────────────

function showToast(message, duration = 2500) {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  container.appendChild(toast);

  // Also update SR announcement
  const announce = document.getElementById('sr-announce');
  if (announce) announce.textContent = message;

  setTimeout(() => {
    toast.classList.add('toast-out');
    toast.addEventListener('animationend', () => toast.remove());
  }, duration);

  // Clean up SR
  setTimeout(() => {
    if (announce) announce.textContent = '';
  }, duration + 500);
}

// ── Character & Word Counter ────────────────────────────────────────────

function updateCounter() {
  const text = getText();
  const charEl = document.getElementById('charCount');
  const wordEl = document.getElementById('wordCount');
  if (charEl) charEl.textContent = text.length;
  if (wordEl) {
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    wordEl.textContent = words;
  }
}

// ── Theme Toggle ────────────────────────────────────────────────────────

function initTheme() {
  const saved = localStorage.getItem('quicklook-theme');
  const theme = saved || 'dark';
  document.documentElement.setAttribute('data-theme', theme);
  updateThemeIcon(theme);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'dark';
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('quicklook-theme', next);
  updateThemeIcon(next);
  showToast(next === 'light' ? '☀️ Light mode' : '🌙 Dark mode');
}

function updateThemeIcon(theme) {
  const sunIcon = document.getElementById('themeIconSun');
  const moonIcon = document.getElementById('themeIconMoon');
  if (sunIcon && moonIcon) {
    sunIcon.style.display = theme === 'dark' ? 'none' : 'block';
    moonIcon.style.display = theme === 'dark' ? 'block' : 'none';
  }
}

// ── Drag & Drop ─────────────────────────────────────────────────────────

let dragCounter = 0;

function initDragDrop() {
  const overlay = document.getElementById('dropOverlay');
  const textarea = document.getElementById('inputText');

  document.addEventListener('dragenter', (e) => {
    e.preventDefault();
    dragCounter++;
    if (overlay) overlay.classList.add('active');
  });

  document.addEventListener('dragleave', (e) => {
    e.preventDefault();
    dragCounter--;
    if (dragCounter <= 0) {
      dragCounter = 0;
      if (overlay) overlay.classList.remove('active');
    }
  });

  document.addEventListener('dragover', (e) => {
    e.preventDefault();
  });

  document.addEventListener('drop', (e) => {
    e.preventDefault();
    dragCounter = 0;
    if (overlay) overlay.classList.remove('active');

    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      const file = files[0];
      const allowedTypes = [
        'text/plain', 'text/csv', 'text/html', 'text/markdown',
        'application/json', 'text/javascript', 'text/css',
      ];
      const allowedExts = ['.txt', '.csv', '.json', '.md', '.html', '.htm', '.js', '.css', '.xml', '.log'];
      const ext = '.' + file.name.split('.').pop().toLowerCase();

      if (allowedTypes.includes(file.type) || allowedExts.includes(ext)) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          if (textarea) {
            textarea.value = ev.target.result;
            updateCounter();
            showToast(`📁 Loaded: ${file.name}`);
            // Auto-extract if enabled
            const autoToggle = document.getElementById('autoExtractToggle');
            if (autoToggle && autoToggle.checked) {
              extractText();
            }
          }
        };
        reader.onerror = () => {
          showToast('❌ Failed to read file');
        };
        reader.readAsText(file);
      } else {
        showToast('⚠️ Unsupported file type');
      }
    }
  });
}

// ── Auto-Extract on Paste ───────────────────────────────────────────────

function initAutoExtract() {
  const textarea = document.getElementById('inputText');
  const toggle = document.getElementById('autoExtractToggle');

  // Restore preference
  const saved = localStorage.getItem('quicklook-autoextract');
  if (toggle && saved === 'true') {
    toggle.checked = true;
  }

  // Save preference on change
  if (toggle) {
    toggle.addEventListener('change', () => {
      localStorage.setItem('quicklook-autoextract', toggle.checked);
    });
  }

  if (textarea) {
    textarea.addEventListener('paste', () => {
      // Delay to let paste complete
      setTimeout(() => {
        updateCounter();
        if (toggle && toggle.checked) {
          extractText();
        }
      }, 50);
    });
  }
}

// ── Accordion Behavior ──────────────────────────────────────────────────

function initAccordions() {
  const sections = document.querySelectorAll('.result-section');
  sections.forEach(section => {
    const header = section.querySelector('.section-header');
    if (!header) return;
    // Add chevron if missing
    if (!header.querySelector('.chev')) {
      const chev = document.createElement('span');
      chev.className = 'chev';
      chev.innerHTML = '<i data-lucide="chevron-down"></i>';
      header.appendChild(chev);
    }
    header.setAttribute('role', 'button');
    header.setAttribute('tabindex', '0');
    header.addEventListener('click', (e) => {
      // Don't toggle when clicking copy button
      if (e.target.closest('.section-copy') || e.target.closest('.section-controls')) return;
      toggleSection(section);
    });
    header.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleSection(section);
      }
    });
  });
  updateAccordionMode();
  window.addEventListener('resize', () => updateAccordionMode());
}

function toggleSection(section) {
  if (section.classList.contains('collapsed')) {
    section.classList.remove('collapsed');
    section.classList.add('expanded');
    section.querySelector('.section-header')?.setAttribute('aria-expanded', 'true');
  } else {
    section.classList.remove('expanded');
    section.classList.add('collapsed');
    section.querySelector('.section-header')?.setAttribute('aria-expanded', 'false');
  }
}

function updateAccordionMode() {
  const small = window.innerWidth <= 700;
  document.querySelectorAll('.result-section').forEach(section => {
    if (small) {
      if (!section.classList.contains('collapsed') && !section.classList.contains('expanded')) {
        section.classList.add('collapsed');
        section.querySelector('.section-header')?.setAttribute('aria-expanded', 'false');
      }
    } else {
      section.classList.remove('collapsed');
      section.classList.add('expanded');
      section.querySelector('.section-header')?.setAttribute('aria-expanded', 'true');
    }
  });
}

// ── Keyboard Shortcuts ──────────────────────────────────────────────────

document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
    e.preventDefault();
    extractText();
  }
});

// ── Input Listeners ─────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  const textarea = document.getElementById('inputText');
  if (textarea) {
    textarea.addEventListener('input', updateCounter);
  }
});

// ── Expose Functions for Inline HTML Handlers ───────────────────────────

window.extractText = extractText;
window.clearAll = clearAll;
window.exportJSON = exportJSON;
window.exportCSV = exportCSV;
window.copySection = copySection;
window.toggleTheme = toggleTheme;

// ── Chrome Extension Integration ────────────────────────────────────────

function initExtensionContext() {
  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id) {
    // We are running inside a Chrome extension
    document.body.classList.add('is-extension-popup');
    
    if (chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(["quicklookPendingText"], (result) => {
        if (result.quicklookPendingText) {
          const textarea = document.getElementById('inputText');
          if (textarea) {
            textarea.value = result.quicklookPendingText;
            updateCounter();
            
            // Slight delay to let UI render before extracting
            setTimeout(() => {
              extractText();
              showToast('⚡ Extracted from Context Menu');
            }, 100);
          }
          
          // Clear the storage and badge
          chrome.storage.local.remove("quicklookPendingText");
          if (chrome.action && chrome.action.setBadgeText) {
            chrome.action.setBadgeText({ text: "" });
          }
        }
      });
    }
  }
}
// ── Initialize ──────────────────────────────────────────────────────────

function init() {
  initTheme();
  initAccordions();
  initDragDrop();
  initAutoExtract();
  initExtensionContext();
  updateCounter();
  
  if (window.lucide) {
    lucide.createIcons();
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
