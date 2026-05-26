import { extract, getTopKeywords, sanitizeUrl } from '../src/extract.js';

describe('extract()', () => {
  test('extracts urls, emails, phones, hashtags, socials and keywords', () => {
    const text = `Hello visit https://example.com or www.test.com and contact me at foo@example.com or +1 555-123-4567. Foo foo bar. #coding #javascript @bijanmurmu`;
    const res = extract(text);
    expect(res.urls).toContain('https://example.com');
    expect(res.urls).toContain('http://www.test.com');
    expect(res.emails).toContain('foo@example.com');
    expect(res.phones.length).toBeGreaterThan(0);
    expect(res.keywords.includes('hello')).toBeTruthy();
    expect(res.hashtags).toContain('#coding');
    expect(res.hashtags).toContain('#javascript');
    expect(res.socials).toContain('@bijanmurmu');
  });

  test('extracts obfuscated emails', () => {
    const text = `Reach out at john [at] example dot com or jane(at)test.org or bob AT foo DOT net`;
    const res = extract(text);
    expect(res.emails).toContain('john@example.com');
    expect(res.emails).toContain('jane@test.org');
    expect(res.emails).toContain('bob@foo.net');
  });

  test('extracts international phones using libphonenumber-js', () => {
    const text = `Call me at +44 20 7123 4567 or +81 90-1234-5678.`;
    const res = extract(text);
    expect(res.phones.length).toBeGreaterThan(0);
  });

  test('extracts social media links', () => {
    const text = `Follow me at twitter.com/test_user or linkedin.com/in/john-doe and x.com/coolguy`;
    const res = extract(text);
    expect(res.socials).toContain('twitter.com/test_user');
    expect(res.socials).toContain('linkedin.com/in/john-doe');
    expect(res.socials).toContain('x.com/coolguy');
  });

  test('handles empty input', () => {
    const res = extract('');
    expect(res.urls).toEqual([]);
    expect(res.emails).toEqual([]);
    expect(res.phones).toEqual([]);
    expect(res.keywords).toEqual([]);
    expect(res.hashtags).toEqual([]);
    expect(res.socials).toEqual([]);
  });

  test('deduplicates results', () => {
    const text = 'Visit https://example.com and https://example.com again. Email foo@bar.com and foo@bar.com. @bijan and @bijan';
    const res = extract(text);
    expect(res.urls.length).toBe(1);
    expect(res.emails.length).toBe(1);
    expect(res.socials.length).toBe(1);
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
