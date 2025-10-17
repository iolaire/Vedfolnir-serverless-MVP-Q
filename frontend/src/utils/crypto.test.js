import { describe, it, expect, beforeEach } from 'vitest'
import { encryptToken, decryptToken, generateKey } from './crypto'

describe('Crypto utilities', () => {
  let testKey

  beforeEach(async () => {
    testKey = await generateKey()
  })

  it('encrypts and decrypts tokens correctly', async () => {
    const token = 'test-mastodon-token-123'
    
    const encrypted = await encryptToken(token, testKey)
    expect(encrypted).toBeDefined()
    expect(encrypted).not.toBe(token)
    
    const decrypted = await decryptToken(encrypted, testKey)
    expect(decrypted).toBe(token)
  })

  it('generates different encrypted values for same token', async () => {
    const token = 'test-token'
    
    const encrypted1 = await encryptToken(token, testKey)
    const encrypted2 = await encryptToken(token, testKey)
    
    expect(encrypted1).not.toBe(encrypted2)
  })

  it('fails to decrypt with wrong key', async () => {
    const token = 'test-token'
    const wrongKey = await generateKey()
    
    const encrypted = await encryptToken(token, testKey)
    
    await expect(decryptToken(encrypted, wrongKey)).rejects.toThrow()
  })
})
