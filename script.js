/* Extraction logic (inlined for browser use) - keeps UI independent of module loading so
   the page works when opened via file:// or simple static servers.
*/

function sanitizeUrl(u) {
  if (!u) return u;
  if (/^www\./i.test(u)) return 'http://' + u;
  return u;
}

function getTopKeywords(text, limit = 10) {
  if (!text) return [];
  const stop = new Set(['this', 'that', 'with', 'from', 'your', 'have', 'which', 'about', 'there', 'their', 'they']);
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
  // Improved URL regex: capture http(s) and www. and stop at common delimiters, avoid \b that breaks on '.'
  const urlRe = /((?:https?:\/\/|www\.)[^\s"'<>)]+)/gim;
  const emailRe = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
  const phoneRe = /\b(?:\+?\d{1,3}[ .-]?)?(?:\(?\d{1,4}\)?[ .-]?)?\d{1,4}[ .-]?\d{1,4}(?:[ .-]?\d{1,9})?\b/g;

  const urls = [...safeText.matchAll(urlRe)].map(m => sanitizeUrl(m[0]));
  const emails = [...safeText.matchAll(emailRe)].map(m => m[0]);
  const phones = [...safeText.matchAll(phoneRe)].map(m => m[0]).filter(p => p.replace(/\D/g, '').length >= 7);
  const keywords = getTopKeywords(safeText, 10);

  return { urls, emails, phones, keywords };
}

function updateSectionStates() {
  ['links','emails','phones','keywords'].forEach(id => {
    const ul = document.querySelector(`#${id} ul`);
    const section = document.getElementById(id);
    if (!ul || !section) return;
    const items = [...ul.querySelectorAll('li')].map(li => li.textContent).filter(t => t && t !== '— none —');
    const countEl = section.querySelector('.count');
    if (countEl) countEl.textContent = items.length ? items.length : '';
    if (!items.length) {
      section.classList.add('empty');
    } else {
      section.classList.remove('empty');
    }
  });
}

/* UI helpers (delegates extraction to local extractLib) */

function getText() {
  return document.getElementById('inputText').value || '';
}

async function extractText() {
  const text = getText();
  const { urls, emails, phones, keywords } = extractLib(text);

  fillList('links', urls, true, true);
  fillList('emails', emails, true, true);
  fillList('phones', phones, true, true);
  fillList('keywords', keywords, false, false);

  const results = document.getElementById('results');
  if (results) results.focus();
  updateSectionStates();
}

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
      if (ok) resolve(); else reject(new Error('execCommand copy failed'));
    } catch (e) {
      reject(e);
    }
  });
}

function fillList(id, items, copyable = false, makeClickable = false) {
  const ul = document.querySelector(`#${id} ul`);
  if (!ul) return;
  ul.innerHTML = '';
  if (!items || items.length === 0) {
    const li = document.createElement('li');
    li.textContent = '— none —';
    ul.appendChild(li);
    return;
  }

  items.forEach(item => {
    const li = document.createElement('li');
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
      const icon = document.createElement('img');
      icon.src = 'assets/copy.png';
      icon.alt = '';
      btn.appendChild(icon);

        btn.addEventListener('click', async () => {
          try {
            await writeToClipboard(item);
            const old = icon.src;
            icon.src = 'assets/check.png';
            const announce = document.getElementById('sr-announce');
            if (announce) announce.textContent = `Copied ${item}`;
            setTimeout(() => {
              icon.src = old;
              if (announce) announce.textContent = '';
            }, 1000);
          } catch (e) {
            console.warn('Clipboard write failed', e);
          }
        });

      li.appendChild(btn);
    }

    ul.appendChild(li);
  });
}

function clearAll() {
  document.getElementById('inputText').value = '';
  ['links','emails','phones','keywords'].forEach(id => {
    const ul = document.querySelector(`#${id} ul`);
    if (ul) ul.innerHTML = '';
    const section = document.getElementById(id);
    if (section) section.classList.add('empty');
    const countEl = section && section.querySelector('.count');
    if (countEl) countEl.textContent = '';
  });
  const announce = document.getElementById('sr-announce');
  if (announce) announce.textContent = 'Results cleared';
  setTimeout(() => { if (announce) announce.textContent = ''; }, 1000);
}

function exportJSON() {
  const data = collectResults();
  download(JSON.stringify(data, null, 2), 'quicklook-results.json', 'application/json');
}

function exportCSV() {
  const data = collectResults();
  let csv = 'category,value\n';
  Object.keys(data).forEach(cat => {
    data[cat].forEach(v => {
      csv += `${escapeCsv(cat)},${escapeCsv(v)}\n`;
    });
  });
  download(csv, 'quicklook-results.csv', 'text/csv');
}

function copySection(id) {
  const read = id => [...document.querySelectorAll(`#${id} ul li`)].map(li => li.textContent).filter(t => t && t !== '— none —');
  const items = read(id);
  if (!items.length) return;
  const text = items.join('\n');
  writeToClipboard(text).then(() => {
    const section = document.getElementById(id);
    const btn = section && section.querySelector('.section-copy');
    if (btn) {
      const old = btn.textContent;
      btn.textContent = 'Copied';
      setTimeout(() => (btn.textContent = old), 1200);
    }
    const announce = document.getElementById('sr-announce');
    if (announce) announce.textContent = `Copied ${items.length} items from ${id}`;
    setTimeout(() => { if (announce) announce.textContent = ''; }, 1200);
  }).catch(e => console.warn('Copy failed', e));
}

function escapeCsv(s) {
  if (s == null) return '';
  const str = String(s).replace(/"/g, '""');
  return `"${str}"`;
}

function collectResults() {
  const read = id => [...document.querySelectorAll(`#${id} ul li`)].map(li => li.textContent).filter(t => t && t !== '— none —');
  return {
    links: read('links'),
    emails: read('emails'),
    phones: read('phones'),
    keywords: read('keywords')
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

// Keyboard: Ctrl+Enter to extract
document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
    e.preventDefault();
    extractText();
  }
});

// Expose functions for inline HTML handlers
window.extractText = extractText;
window.clearAll = clearAll;
window.exportJSON = exportJSON;
window.exportCSV = exportCSV;
window.copySection = copySection;

// Accordion behavior for result sections (mobile-first)
function initAccordions() {
  const sections = document.querySelectorAll('.result-section');
  sections.forEach(section => {
    const header = section.querySelector('.section-header');
    if (!header) return;
    // add chevron if missing
    if (!header.querySelector('.chev')) {
      const chev = document.createElement('span');
      chev.className = 'chev';
      chev.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linej[...]
      header.appendChild(chev);
    }
    header.setAttribute('role', 'button');
    header.setAttribute('tabindex', '0');
    header.addEventListener('click', () => toggleSection(section));
    header.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleSection(section); } });
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
      // collapse by default on small
      if (!section.classList.contains('collapsed')) {
        section.classList.remove('expanded');
        section.classList.add('collapsed');
        section.querySelector('.section-header')?.setAttribute('aria-expanded', 'false');
      }
    } else {
      // expand on larger screens
      section.classList.remove('collapsed');
      section.classList.add('expanded');
      section.querySelector('.section-header')?.setAttribute('aria-expanded', 'true');
    }
  });
}

// Initialize when DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAccordions);
} else {
  initAccordions();
}
