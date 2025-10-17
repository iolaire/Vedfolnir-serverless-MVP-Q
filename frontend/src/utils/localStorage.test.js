import { describe, it, expect, beforeEach } from 'vitest'
import { saveToken, getToken, clearToken } from './localStorage'

describe('localStorage utilities', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('saves and retrieves tokens', () => {
    const token = 'encrypted-token-data'
    
    saveToken(token)
    const retrieved = getToken()
    
    expect(retrieved).toBe(token)
  })

  it('returns null when no token exists', () => {
    const retrieved = getToken()
    expect(retrieved).toBeNull()
  })

  it('clears stored tokens', () => {
    saveToken('test-token')
    clearToken()
    
    const retrieved = getToken()
    expect(retrieved).toBeNull()
  })
})
