/*
  Extraction utilities for QuickLook.
  Exported for both browser module use and Node.js testing.
*/

export function sanitizeUrl(u) {
  if (!u) return u;
  if (/^www\./i.test(u)) return 'http://' + u;
  return u;
}

export function getTopKeywords(text, limit = 10) {
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

export function extract(text) {
  const safeText = text || '';
  const urlRe = /\b((?:https?:\/\/|www\.)\S+?)\b/gim;
  const emailRe = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
  const phoneRe = /\b(?:\+?\d{1,3}[ .-]?)?(?:\(?\d{1,4}\)?[ .-]?)?\d{1,4}[ .-]?\d{1,4}(?:[ .-]?\d{1,9})?\b/g;

  const urls = [...safeText.matchAll(urlRe)].map(m => sanitizeUrl(m[0]));
  const emails = [...safeText.matchAll(emailRe)].map(m => m[0]);
  const phones = [...safeText.matchAll(phoneRe)].map(m => m[0]).filter(p => p.replace(/\D/g, '').length >= 7);
  const keywords = getTopKeywords(safeText, 10);

  return { urls, emails, phones, keywords };
}

// Default export for CommonJS interop if needed
export default { sanitizeUrl, getTopKeywords, extract };
