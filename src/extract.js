import libphonenumber from 'libphonenumber-js';

export function sanitizeUrl(u) {
  if (!u) return u;
  if (/^www\./i.test(u)) return 'http://' + u;
  return u;
}

export function getTopKeywords(text, limit = 10) {
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

export function extract(text) {
  const safeText = text || '';
  const urlRe = /((?:https?:\/\/|www\.)[^\s"'<>)]+)/gim;
  
  const emailRe = /\b[A-Za-z0-9._%+-]+(?:\s*(?:@|\[at\]|\(at\)|AT)\s*)[A-Za-z0-9.-]+(?:\s*(?:\.|\[dot\]|\(dot\)|DOT)\s*)[A-Za-z]{2,}\b/gi;
  const socialRe = /(?:https?:\/\/)?(?:www\.)?(twitter\.com\/[A-Za-z0-9_]+|x\.com\/[A-Za-z0-9_]+|instagram\.com\/[A-Za-z0-9_.-]+|linkedin\.com\/in\/[A-Za-z0-9_-]+)|(?<=^|\s)@([A-Za-z0-9_]+)\b/gi;
  const hashtagRe = /#[A-Za-z][A-Za-z0-9_]{1,}/g;

  const urls = [...new Set([...safeText.matchAll(urlRe)].map(m => sanitizeUrl(m[0])))];
  
  const emailsRaw = [...safeText.matchAll(emailRe)].map(m => m[0]);
  const emails = [...new Set(emailsRaw.map(e => e.replace(/\s*(?:\[at\]|\(at\)|AT)\s*/i, '@').replace(/\s*(?:\[dot\]|\(dot\)|DOT)\s*/i, '.').toLowerCase()))];
  
  let phones = [];
  if (libphonenumber && libphonenumber.findNumbers) {
    const found = libphonenumber.findNumbers(safeText, 'US', { v2: true });
    phones = [...new Set(found.map(i => i.number.number || i.number))];
  } else {
    const phoneRe = /\b(?:\+?\d{1,3}[ .-]?)?(?:\(?\d{1,4}\)?[ .-]?)?\d{1,4}[ .-]?\d{1,4}(?:[ .-]?\d{1,9})?\b/g;
    phones = [...new Set([...safeText.matchAll(phoneRe)].map(m => m[0]).filter(p => p.replace(/\D/g, '').length >= 7))];
  }

  const socials = [...new Set([...safeText.matchAll(socialRe)].map(m => m[0].trim()))];
  const hashtags = [...new Set([...safeText.matchAll(hashtagRe)].map(m => m[0]))];
  const keywords = getTopKeywords(safeText, 10);

  return { urls, emails, phones, socials, keywords, hashtags };
}

export default { sanitizeUrl, getTopKeywords, extract };
