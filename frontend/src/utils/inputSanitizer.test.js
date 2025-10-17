import { describe, it, expect } from 'vitest'
import { sanitizeToken, sanitizeUrl } from './inputSanitizer'

describe('Input sanitization', () => {
  it('sanitizes tokens by removing whitespace', () => {
    expect(sanitizeToken('  token123  ')).toBe('token123')
    expect(sanitizeToken('\ntoken\t')).toBe('token')
  })

  it('rejects invalid tokens', () => {
    expect(sanitizeToken('')).toBe('')
    expect(sanitizeToken('   ')).toBe('')
    expect(sanitizeToken(null)).toBe('')
  })

  it('sanitizes URLs correctly', () => {
    expect(sanitizeUrl('https://mastodon.social')).toBe('https://mastodon.social')
    expect(sanitizeUrl('  https://example.com  ')).toBe('https://example.com')
  })

  it('rejects invalid URLs', () => {
    expect(sanitizeUrl('not-a-url')).toBe('')
    expect(sanitizeUrl('javascript:alert(1)')).toBe('')
    expect(sanitizeUrl('')).toBe('')
  })
})
