import { extract, getTopKeywords, sanitizeUrl } from '../src/extract.js';

describe('extract()', () => {
  test('extracts urls, emails, phones and keywords', () => {
    const text = `Hello visit https://example.com or www.test.com. Contact me at foo@example.com or +1 555-123-4567. Foo foo bar.`;
    const res = extract(text);
    expect(res.urls).toContain('https://example.com');
    expect(res.urls).toContain('http://www.test.com');
    expect(res.emails).toContain('foo@example.com');
    expect(res.phones.length).toBeGreaterThan(0);
    expect(res.keywords.includes('foo')).toBeTruthy();
  });

  test('handles empty input', () => {
    const res = extract('');
    expect(res.urls).toEqual([]);
    expect(res.emails).toEqual([]);
    expect(res.phones).toEqual([]);
    expect(res.keywords).toEqual([]);
  });
});

describe('getTopKeywords()', () => {
  test('returns most frequent words', () => {
    const text = 'apple apple banana orange apple banana';
    const top = getTopKeywords(text, 2);
    expect(top).toEqual(['apple','banana']);
  });
});

describe('sanitizeUrl()', () => {
  test('prefixes www with http', () => {
    expect(sanitizeUrl('www.test.com')).toBe('http://www.test.com');
  });
});
