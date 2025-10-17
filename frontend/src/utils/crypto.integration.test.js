import { describe, it, expect, beforeEach } from 'vitest'
import { generateKey, encryptToken, decryptToken } from './crypto'
import { saveToken, getToken, clearToken } from './localStorage'
import { sanitizeToken, sanitizeUrl } from './inputSanitizer'

describe('Crypto integration workflow', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('completes full token encryption workflow', async () => {
    // 1. Sanitize input
    const rawToken = '  mastodon-token-123  '
    const sanitized = sanitizeToken(rawToken)
    expect(sanitized).toBe('mastodon-token-123')

    // 2. Generate encryption key
    const key = await generateKey()
    expect(key).toBeDefined()

    // 3. Encrypt token
    const encrypted = await encryptToken(sanitized, key)
    expect(encrypted).toBeDefined()
    expect(encrypted).not.toBe(sanitized)

    // 4. Save to localStorage
    saveToken(encrypted)
    const stored = getToken()
    expect(stored).toBe(encrypted)

    // 5. Retrieve and decrypt
    const decrypted = await decryptToken(stored, key)
    expect(decrypted).toBe(sanitized)
  })

  it('validates URLs correctly', () => {
    expect(sanitizeUrl('https://mastodon.social')).toBe('https://mastodon.social')
    expect(sanitizeUrl('javascript:alert(1)')).toBe('')
  })

  it('handles token cleanup', () => {
    saveToken('test-encrypted-token')
    expect(getToken()).toBe('test-encrypted-token')
    
    clearToken()
    expect(getToken()).toBeNull()
  })
})
