let formattingEnabled = false;
/* ========================================================================
   QuickLook — Main Application Script
   Phases 1-4: Extraction, Extension, Advanced Regex, NER, Highlighting
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

  // Advanced: catches normal + obfuscated emails
  const emailRe = /\b[A-Za-z0-9._%+-]+(?:\s*(?:@|\[at\]|\(at\)|AT)\s*)[A-Za-z0-9.-]+(?:\s*(?:\.|\[dot\]|\(dot\)|DOT)\s*)[A-Za-z]{2,}\b/gi;

  // Social profiles: full URLs + bare @handles
  const socialRe = /(?:https?:\/\/)?(?:www\.)?((?:twitter|x|instagram|linkedin)\.com\/(?:in\/)?[A-Za-z0-9_.-]+)/gi;
  const handleRe = /@[A-Za-z0-9_]{2,}\b/g;

  const hashtagRe = /#[A-Za-z][A-Za-z0-9_]{1,}/g;

  // --- URLs ---
  const urls = [...new Set([...safeText.matchAll(urlRe)].map(m => sanitizeUrl(m[0])))];

  // --- Emails (de-obfuscated) ---
  const emailsRaw = [...safeText.matchAll(emailRe)].map(m => m[0]);
  const emails = [...new Set(
    emailsRaw.map(e =>
      e.replace(/\s*(?:\[at\]|\(at\)|AT)\s*/i, '@')
       .replace(/\s*(?:\[dot\]|\(dot\)|DOT)\s*/i, '.')
       .toLowerCase()
    )
  )];

  // --- Phones (libphonenumber-js if available, fallback regex) ---
  let phones = [];
  if (typeof libphonenumber !== 'undefined' && libphonenumber.findNumbers) {
    const found = libphonenumber.findNumbers(safeText, 'US', { v2: true });
    phones = [...new Set(found.map(i => i.number.number || i.number))];
  } else {
    const phoneRe = /\b(?:\+?\d{1,3}[ .-]?)?(?:\(?\d{1,4}\)?[ .-]?)?\d{1,4}[ .-]?\d{1,4}(?:[ .-]?\d{1,9})?\b/g;
    phones = [...new Set(
      [...safeText.matchAll(phoneRe)].map(m => m[0]).filter(p => p.replace(/\D/g, '').length >= 7)
    )];
  }

  // --- Socials ---
  const socialUrls = [...safeText.matchAll(socialRe)].map(m => m[0].trim());
  const handles = [];
  let hMatch;
  handleRe.lastIndex = 0;
  while ((hMatch = handleRe.exec(safeText)) !== null) {
    const prevChar = hMatch.index === 0 ? '' : safeText[hMatch.index - 1];
    if (!/[&\w@]/.test(prevChar)) handles.push(hMatch[0]);
  }
  const socials = [...new Set([...socialUrls, ...handles])];

  // --- Hashtags ---
  const hashtags = [...new Set([...safeText.matchAll(hashtagRe)].map(m => m[0]))];

  // --- Keywords ---
  const keywords = getTopKeywords(safeText, 10);

  return { urls, emails, phones, socials, keywords, hashtags };
}

// ── Section State Management ────────────────────────────────────────────

const SECTIONS = ['links', 'emails', 'phones', 'hashtags', 'socials', 'keywords', 'crypto', 'ips'];

function updateSectionStates() {
  SECTIONS.forEach(id => {
    const ul = document.querySelector(`#${id} ul`);
    const section = document.getElementById(id);
    if (!ul || !section) return;
    const items = [...ul.querySelectorAll('li:not(.empty-item)')];
    const countEl = section.querySelector('.count');
    if (countEl) countEl.textContent = items.length ? items.length : '';
    section.classList.toggle('empty', items.length === 0);
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

  const { urls, emails, phones, socials: _socials, keywords: _keywords, hashtags } = extractLib(text);

  // Apply formatting if toggle is on
  const fUrls   = formattingEnabled ? urls.map(formatUrl) : urls;
  const fPhones = formattingEnabled ? phones.map(formatPhone) : phones;
  const socials  = _socials;
  const keywords = _keywords;
  
  // Phase 5 Extractors
  const cryptoMatch = text.match(/\b(0x[a-fA-F0-9]{40}|[13][a-km-zA-HJ-NP-Z1-9]{25,34}|bc1[a-z0-9]{39,59})\b/g);
  const crypto = [...new Set(cryptoMatch || [])];
  
  const ipsMatch = text.match(/\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g);
  const ips = [...new Set(ipsMatch || [])];

  fillList('links',    fUrls,   true, true);
  fillList('emails',   emails,  true, true);
  fillList('phones',   fPhones, true, true);
  fillList('hashtags', hashtags, true, false);
  fillList('socials',  socials, true, true);
  fillList('keywords', keywords, false, false);
  fillList('crypto',   crypto,  true, false);
  fillList('ips',      ips,     true, false);

  updateSectionStates();
  renderHighlights();
  saveHistory(text);

  if (window.lucide) lucide.createIcons();

  const total = fUrls.length + emails.length + fPhones.length + socials.length + hashtags.length + keywords.length + crypto.length + ips.length;
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
      if (ok) resolve(); else reject(new Error('execCommand failed'));
    } catch (e) { reject(e); }
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
      content.href = item;
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
          showToast(`📋 Copied: ${item.length > 40 ? item.slice(0, 40) + '…' : item}`);
          setTimeout(() => {
            btn.innerHTML = '<i data-lucide="copy"></i>';
            if (window.lucide) lucide.createIcons({ root: btn });
          }, 1200);
        } catch (e) {
          showToast('❌ Copy failed');
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
  // Clear NER too
  ['ner-people', 'ner-orgs', 'ner-locs', 'ner-misc'].forEach(id => {
    const ul = document.querySelector(`#${id} ul`);
    if (ul) ul.innerHTML = '';
  });
  const nerCount = document.querySelector('#ai-insights .count');
  if (nerCount) nerCount.textContent = '';

  // Clear highlights
  const hc = document.getElementById('highlightContent');
  if (hc) hc.innerHTML = '';

  updateCounter();
  showToast('🧹 Cleared');
}

// ── Export ───────────────────────────────────────────────────────────────

function exportJSON() {
  const data = collectResults();
  if (!Object.values(data).some(arr => arr.length > 0)) { showToast('⚠️ Nothing to export'); return; }
  download(JSON.stringify(data, null, 2), 'quicklook-results.json', 'application/json');
  showToast('📥 Exported as JSON');
}

function exportCSV() {
  const data = collectResults();
  if (!Object.values(data).some(arr => arr.length > 0)) { showToast('⚠️ Nothing to export'); return; }
  let csv = 'category,value\n';
  Object.keys(data).forEach(cat => data[cat].forEach(v => { csv += `${escapeCsv(cat)},${escapeCsv(v)}\n`; }));
  download(csv, 'quicklook-results.csv', 'text/csv');
  showToast('📥 Exported as CSV');
}

function copySection(id) {
  const items = [...document.querySelectorAll(`#${id} ul li:not(.empty-item)`)]
    .map(li => li.textContent.trim()).filter(Boolean);
  if (!items.length) { showToast('⚠️ Nothing to copy'); return; }
  writeToClipboard(items.join('\n')).then(() => {
    const btn = document.querySelector(`#${id} .section-copy`);
    if (btn) { const old = btn.textContent; btn.textContent = '✓ Copied'; setTimeout(() => btn.textContent = old, 1500); }
    showToast(`📋 Copied ${items.length} ${id}`);
  }).catch(() => showToast('❌ Copy failed'));
}

function escapeCsv(s) {
  if (s == null) return '';
  return `"${String(s).replace(/"/g, '""')}"`;
}

function collectResults() {
  const read = id => [...document.querySelectorAll(`#${id} ul li:not(.empty-item)`)].map(li => li.textContent.trim()).filter(Boolean);
  return { links: read('links'), emails: read('emails'), phones: read('phones'), hashtags: read('hashtags'), socials: read('socials'), keywords: read('keywords'), crypto: read('crypto'), ips: read('ips') };
}

function download(content, filename, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}

// ── Toast Notifications ─────────────────────────────────────────────────

function showToast(message, duration = 2500) {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const emojiMap = {
    '⚠️': 'alert-triangle',
    '❌': 'x-circle',
    '⚡': 'zap',
    '✨': 'sparkles',
    '📋': 'clipboard-copy',
    '🗑️': 'trash-2',
    '📥': 'file-down',
    '📄': 'file-text',
    '✅': 'check-circle'
  };

  let iconName = 'info';
  let cleanMessage = message;
  for (const [emoji, icon] of Object.entries(emojiMap)) {
    if (message.includes(emoji)) {
      iconName = icon;
      cleanMessage = message.replace(emoji, '').trim();
      break;
    }
  }

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `<i data-lucide="${iconName}"></i> <span>${cleanMessage}</span>`;
  container.appendChild(toast);

  if (window.lucide) lucide.createIcons({ root: toast });

  const announce = document.getElementById('sr-announce');
  if (announce) announce.textContent = cleanMessage;
  setTimeout(() => {
    toast.classList.add('toast-out');
    toast.addEventListener('animationend', () => toast.remove());
  }, duration);
  setTimeout(() => { if (announce) announce.textContent = ''; }, duration + 500);
}

// ── History, Filters, Shortcuts ─────────────────────────────────────────

function saveHistory(text) {
  let history = JSON.parse(localStorage.getItem('quicklook-history') || '[]');
  if (history[0] === text) return;
  history.unshift(text);
  localStorage.setItem('quicklook-history', JSON.stringify(history.slice(0, 10)));
}

function restoreHistory() {
  const history = JSON.parse(localStorage.getItem('quicklook-history') || '[]');
  if (history.length === 0) { showToast('⚠️ No history'); return; }
  document.getElementById('inputText').value = history[0];
  updateCounter();
  extractText();
}

function initFilter() {
  const filter = document.getElementById('filterInput');
  filter?.addEventListener('input', e => {
    const val = e.target.value.toLowerCase();
    document.querySelectorAll('.result-section').forEach(s => {
      s.style.display = s.id.toLowerCase().includes(val) ? '' : 'none';
    });
  });
}

function initShortcuts() {
  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); document.getElementById('filterInput')?.focus(); }
    if ((e.ctrlKey || e.metaKey) && e.key === 'h') { e.preventDefault(); restoreHistory(); }
  });
}

// ── Counter ─────────────────────────────────────────────────────────────

function updateCounter() {
  const text = getText();
  const charEl = document.getElementById('charCount');
  const wordEl = document.getElementById('wordCount');
  if (charEl) charEl.textContent = text.length;
  if (wordEl) wordEl.textContent = text.trim() ? text.trim().split(/\s+/).length : 0;
}


// ── Drag & Drop ─────────────────────────────────────────────────────────

let dragCounter = 0;

function initDragDrop() {
  const overlay = document.getElementById('dropOverlay');
  const textarea = document.getElementById('inputText');

  document.addEventListener('dragenter', e => { e.preventDefault(); dragCounter++; overlay?.classList.add('active'); });
  document.addEventListener('dragleave', e => { e.preventDefault(); if (--dragCounter <= 0) { dragCounter = 0; overlay?.classList.remove('active'); } });
  document.addEventListener('dragover',  e => e.preventDefault());

  document.addEventListener('drop', e => {
    e.preventDefault();
    dragCounter = 0;
    overlay?.classList.remove('active');

    const files = e.dataTransfer?.files;
    if (!files?.length) return;

    const file = files[0];
    const allowedExts = ['.txt','.csv','.json','.md','.html','.htm','.js','.css','.xml','.log'];
    const ext = '.' + file.name.split('.').pop().toLowerCase();

    if (ext === '.docx' && window.mammoth) {
      const reader = new FileReader();
      reader.onload = ev => {
        mammoth.extractRawText({arrayBuffer: ev.target.result}).then(result => {
          if (textarea) { textarea.value = result.value; updateCounter(); }
          showToast(`📄 Loaded: ${file.name}`);
          if (document.getElementById('autoExtractToggle')?.checked) extractText();
        }).catch(() => showToast('❌ Failed to parse DOCX'));
      };
      reader.readAsArrayBuffer(file);
      return;
    }

    if (ext === '.pdf') {
      const reader = new FileReader();
      reader.onload = async ev => {
        try {
          const pdfjsLib = await import('./vendor/pdf.min.mjs');
          pdfjsLib.GlobalWorkerOptions.workerSrc = './vendor/pdf.worker.min.mjs';
          const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(ev.target.result) }).promise;
          let text = '';
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            text += content.items.map(item => item.str).join(' ') + '\n\n';
          }
          if (textarea) { textarea.value = text; updateCounter(); }
          showToast(`📄 Loaded: ${file.name}`);
          if (document.getElementById('autoExtractToggle')?.checked) extractText();
        } catch (err) {
          console.error(err);
          showToast('❌ Failed to parse PDF');
        }
      };
      reader.readAsArrayBuffer(file);
      return;
    }

    if (['text/plain','text/csv','text/html','text/markdown','application/json','text/javascript'].includes(file.type) || allowedExts.includes(ext)) {
      const reader = new FileReader();
      reader.onload = ev => {
        if (textarea) {
          textarea.value = ev.target.result;
          updateCounter();
          showToast(`📄 Loaded: ${file.name}`);
          if (document.getElementById('autoExtractToggle')?.checked) extractText();
        }
      };
      reader.onerror = () => showToast('❌ Failed to read file');
      reader.readAsText(file);
    } else {
      showToast('⚠️ Unsupported file type');
    }
  });
}

// ── Auto-Extract on Paste ───────────────────────────────────────────────

function initAutoExtract() {
  const toggle = document.getElementById('autoExtractToggle');
  if (toggle && localStorage.getItem('quicklook-autoextract') === 'true') toggle.checked = true;
  toggle?.addEventListener('change', () => localStorage.setItem('quicklook-autoextract', toggle.checked));

  document.getElementById('inputText')?.addEventListener('paste', () => {
    setTimeout(() => { updateCounter(); if (toggle?.checked) extractText(); }, 50);
  });
}

// ── Accordion ───────────────────────────────────────────────────────────

function initAccordions() {
  document.querySelectorAll('.result-section').forEach(section => {
    const header = section.querySelector('.section-header');
    if (!header) return;
    if (!header.querySelector('.chev')) {
      const chev = document.createElement('span');
      chev.className = 'chev';
      chev.innerHTML = '<i data-lucide="chevron-down"></i>';
      header.appendChild(chev);
    }
    header.setAttribute('role', 'button');
    header.setAttribute('tabindex', '0');
    header.addEventListener('click', e => {
      if (e.target.closest('.section-controls')) return;
      toggleSection(section);
    });
    header.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleSection(section); }
    });
  });
  updateAccordionMode();
  window.addEventListener('resize', updateAccordionMode);
}

function toggleSection(section) {
  const collapsed = section.classList.contains('collapsed');
  section.classList.toggle('collapsed', !collapsed);
  section.classList.toggle('expanded', collapsed);
  section.querySelector('.section-header')?.setAttribute('aria-expanded', String(collapsed));
}

function updateAccordionMode() {
  const isExtension = document.body.classList.contains('is-extension-popup');
  const small = window.innerWidth <= 700 && !isExtension;
  document.querySelectorAll('.result-section').forEach(section => {
    if (small && !section.classList.contains('collapsed') && !section.classList.contains('expanded')) {
      section.classList.add('collapsed');
      section.querySelector('.section-header')?.setAttribute('aria-expanded', 'false');
    } else if (!small) {
      section.classList.remove('collapsed');
      section.classList.add('expanded');
      section.querySelector('.section-header')?.setAttribute('aria-expanded', 'true');
    }
  });
}

// ── Phase 4: Live Text Highlighting ────────────────────────────────────

const HIGHLIGHT_REGEXES = [
  { re: /((?:https?:\/\/|www\.)[^\s"'<>)]+)/gim,             cls: 'hl-link'    },
  { re: /\b[A-Za-z0-9._%+-]+(?:\s*(?:@|\[at\]|\(at\)|AT)\s*)[A-Za-z0-9.-]+(?:\s*(?:\.|\[dot\]|\(dot\)|DOT)\s*)[A-Za-z]{2,}\b/gi, cls: 'hl-email'   },
  { re: /#[A-Za-z][A-Za-z0-9_]{1,}/g,                        cls: 'hl-hashtag' },
  { re: /@[A-Za-z0-9_]{2,}\b/g,                              cls: 'hl-social', checkPrev: /[&\w@]/ },
];

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>');
}

function renderHighlights() {
  const backdrop = document.getElementById('highlightContent');
  const textarea = document.getElementById('inputText');
  if (!backdrop || !textarea) return;

  const text = textarea.value;
  if (!text) { backdrop.innerHTML = ''; return; }

  // Collect all ranges
  const ranges = [];
  for (const { re, cls, checkPrev } of HIGHLIGHT_REGEXES) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(text)) !== null) {
      if (checkPrev && m.index > 0 && checkPrev.test(text[m.index - 1])) continue;
      ranges.push({ start: m.index, end: m.index + m[0].length, cls });
    }
  }

  ranges.sort((a, b) => a.start - b.start);

  let html = '';
  let pos = 0;
  for (const r of ranges) {
    if (r.start < pos) continue; // skip overlaps
    html += escapeHtml(text.slice(pos, r.start));
    html += `<mark class="${r.cls}">${escapeHtml(text.slice(r.start, r.end))}</mark>`;
    pos = r.end;
  }
  html += escapeHtml(text.slice(pos));
  backdrop.innerHTML = html;
}

function initHighlighting() {
  const textarea = document.getElementById('inputText');
  const backdrop = document.getElementById('highlightBackdrop');
  if (!textarea || !backdrop) return;

  // Sync scroll
  textarea.addEventListener('scroll', () => {
    backdrop.scrollTop = textarea.scrollTop;
    backdrop.scrollLeft = textarea.scrollLeft;
  });

  // Re-render on every keystroke
  textarea.addEventListener('input', () => {
    updateCounter();
    renderHighlights();
  });
}

// ── Phase 4: Formatting Toggle ──────────────────────────────────────────


function toggleFormatting() {
  formattingEnabled = !formattingEnabled;
  const btn = document.getElementById('formatToggleBtn');
  btn?.classList.toggle('active', formattingEnabled);
  showToast(formattingEnabled ? '✨ Formatting ON — re-extracting…' : '✨ Formatting OFF — re-extracting…');
  if (getText().trim()) extractText();
}

function formatUrl(url) {
  if (!formattingEnabled) return url;
  if (/^http:\/\//i.test(url)) return 'https://' + url.slice(7);
  return url;
}

function formatPhone(phone) {
  if (!formattingEnabled) return phone;
  if (typeof libphonenumber !== 'undefined' && libphonenumber.parsePhoneNumber) {
    try { return libphonenumber.parsePhoneNumber(phone, 'US').formatInternational(); } catch { /* fall through */ }
  }
  return phone;
}

// ── Phase 3: Named Entity Recognition (NER) ────────────────────────────

let nerWorker = null;

function initNER() {
  const btn = document.getElementById('nerRunBtn');
  btn?.addEventListener('click', runNER);
}

function runNER() {
  const text = getText();
  if (!text.trim()) { showToast('⚠️ Enter some text first'); return; }

  if (!nerWorker) {
    if (window.location.protocol === 'file:') {
      showToast('❌ NER requires a local server or Chrome Extension mode (file:// blocked)');
      return;
    }
    nerWorker = new Worker('ner-worker.js', { type: 'module' });
    nerWorker.onmessage  = handleNERMessage;
    nerWorker.onerror    = err => { 
      const msg = err.message || 'Worker failed to load. Check console for CORS or 404 errors.';
      showToast('❌ NER failed: ' + msg); 
      setNERStatus(''); 
    };
  }

  const btn = document.getElementById('nerRunBtn');
  if (btn) btn.disabled = true;
  nerWorker.postMessage({ type: 'run', text });
}

function handleNERMessage(e) {
  const { type, message, pct, file, entities, summary, sentiment } = e.data;
  const btn   = document.getElementById('nerRunBtn');
  const bar   = document.getElementById('nerStatusBar');
  const prog  = document.getElementById('nerProgressWrap');
  const progB = document.getElementById('nerProgressBar');

  if (type === 'status') {
    setNERStatus(message);
    bar?.style.setProperty('display', 'flex');
  } else if (type === 'progress') {
    bar?.style.setProperty('display', 'flex');
    prog?.style.setProperty('display', 'block');
    if (progB) progB.style.width = `${pct}%`;
    setNERStatus(`Downloading model... ${pct}%`);
  } else if (type === 'done') {
    bar?.style.setProperty('display', 'none');
    prog?.style.setProperty('display', 'none');
    if (progB) progB.style.width = '0%';
    if (btn) btn.disabled = false;
    
    const aiCards = document.getElementById('aiCards');
    if (aiCards) aiCards.style.display = 'grid';
    const sumText = document.getElementById('aiSummaryText');
    if (sumText) sumText.textContent = summary || 'No summary generated.';
    const sentBadge = document.getElementById('aiSentimentBadge');
    if (sentBadge && sentiment) {
      const isPos = sentiment.label === 'POSITIVE';
      const isNeg = sentiment.label === 'NEGATIVE';
      const label = isPos ? 'Positive' : (isNeg ? 'Negative' : 'Neutral');
      const cls = isPos ? 'positive' : (isNeg ? 'negative' : 'neutral');
      sentBadge.textContent = `${label} (${Math.round(sentiment.score * 100)}%)`;
      sentBadge.className = `sentiment-badge ${cls}`;
    }
    renderEntities(entities);
  } else if (type === 'error') {
    bar?.style.setProperty('display', 'none');
    if (btn) btn.disabled = false;
    showToast('❌ NER error: ' + message);
  }
}


function setNERStatus(msg) {
  const el = document.getElementById('nerStatusText');
  if (el) el.textContent = msg;
}

function renderEntities(entities) {
  const people = [...new Set(entities.filter(e => e.entity_group === 'PER').map(e => e.word))];
  const orgs   = [...new Set(entities.filter(e => e.entity_group === 'ORG').map(e => e.word))];
  const locs   = [...new Set(entities.filter(e => e.entity_group === 'LOC').map(e => e.word))];
  const misc   = [...new Set(entities.filter(e => e.entity_group === 'MISC').map(e => e.word))];

  fillEntityGroup('ner-people', people);
  fillEntityGroup('ner-orgs',   orgs);
  fillEntityGroup('ner-locs',   locs);
  fillEntityGroup('ner-misc',   misc);

  const total = people.length + orgs.length + locs.length + misc.length;
  showToast(`✨ Found ${total} named entities`);
  const countEl = document.querySelector('#ai-insights .count');
  if (countEl) countEl.textContent = total || '';

  const section = document.getElementById('ai-insights');
  
  if (window.lucide) lucide.createIcons();
}

function fillEntityGroup(id, items) {
  const ul = document.querySelector(`#${id} ul`);
  if (!ul) return;
  ul.innerHTML = '';

  if (!items.length) {
    const li = document.createElement('li');
    li.className = 'empty-item';
    li.textContent = 'None found';
    ul.appendChild(li);
    return;
  }

  items.forEach(item => {
    const li  = document.createElement('li');
    const sp  = document.createElement('span');
    sp.textContent = item;
    li.appendChild(sp);

    const btn = document.createElement('button');
    btn.className = 'copy-btn';
    btn.type = 'button';
    btn.setAttribute('aria-label', `Copy ${item}`);
    btn.innerHTML = '<i data-lucide="copy"></i>';
    btn.addEventListener('click', async () => {
      await writeToClipboard(item);
      btn.innerHTML = '<i data-lucide="check"></i>';
      if (window.lucide) lucide.createIcons({ root: btn });
      setTimeout(() => { btn.innerHTML = '<i data-lucide="copy"></i>'; if (window.lucide) lucide.createIcons({ root: btn }); }, 1200);
    });
    li.appendChild(btn);
    ul.appendChild(li);
  });
}

// ── Chrome Extension Integration ─────────────────────────────────────────

function initExtensionContext() {
  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id) {
    document.body.classList.add('is-extension-popup');
    if (chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(['quicklookPendingText'], result => {
        if (result.quicklookPendingText) {
          const textarea = document.getElementById('inputText');
          if (textarea) { textarea.value = result.quicklookPendingText; updateCounter(); }
          chrome.storage.local.remove('quicklookPendingText');
          chrome.action?.setBadgeText?.({ text: '' });
          setTimeout(() => { extractText(); showToast('⚡ Extracted from Context Menu'); }, 100);
        } else if (chrome.tabs && chrome.scripting) {
          chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs && tabs.length > 0 && tabs[0].url && !tabs[0].url.startsWith('chrome://')) {
              chrome.scripting.executeScript({
                target: { tabId: tabs[0].id },
                func: () => document.body.innerText
              }, (res) => {
                if (res && res[0] && res[0].result) {
                  const textarea = document.getElementById('inputText');
                  if (textarea && !textarea.value.trim()) {
                    textarea.value = res[0].result;
                    updateCounter();
                    setTimeout(() => { extractText(); showToast('🌐 Auto-Scraped Page Text'); }, 100);
                  }
                }
              });
            }
          });
        }
      });
    }
  }
}

// ── Keyboard Shortcuts ──────────────────────────────────────────────────

document.addEventListener('keydown', e => {
  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); extractText(); }
});

// ── Expose Globals ──────────────────────────────────────────────────────

window.extractText    = extractText;
window.clearAll       = clearAll;
window.exportJSON     = exportJSON;
window.exportCSV      = exportCSV;
window.copySection    = copySection;
window.toggleFormatting = toggleFormatting;

// ── Initialize ──────────────────────────────────────────────────────────

function initEventListeners() {
  const btn = (id, fn) => document.getElementById(id)?.addEventListener('click', fn);
  btn('extractBtn', extractText);
  btn('clearBtn', clearAll);
  btn('historyBtn', restoreHistory);
  btn('formatToggleBtn', toggleFormatting);
  btn('exportJsonBtn', exportJSON);
  btn('exportCsvBtn', exportCSV);

  document.querySelectorAll('.section-copy').forEach(el => {
    el.addEventListener('click', (e) => {
      const target = e.currentTarget.getAttribute('data-copy-target');
      if (target) copySection(target);
    });
  });
}

function init() {
  initEventListeners();
  initFilter();
  initShortcuts();
  initAccordions();
  initDragDrop();
  initAutoExtract();
  initExtensionContext();
  initHighlighting();
  initNER();
  updateCounter();
  if (window.lucide) lucide.createIcons();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}




