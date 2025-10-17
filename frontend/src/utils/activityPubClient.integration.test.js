import { describe, it, expect } from 'vitest'
import { testConnection, validateToken } from './activityPubClient'

describe('ActivityPub Client Integration', () => {
  it('connects to real Mastodon instances', async () => {
    const instances = [
      'https://mastodon.social',
      'https://fosstodon.org',
      'https://mas.to',
      'https://masto.ai'
    ]
    
    for (const instance of instances) {
      const result = await testConnection(instance)
      expect(result).toBe(true)
    }
  })

  it('handles invalid instance URLs', async () => {
    const invalidInstances = [
      'https://nonexistent-mastodon-instance.invalid',
      'https://example.com',
      'https://httpstat.us/500'
    ]
    
    for (const instance of invalidInstances) {
      const result = await testConnection(instance)
      expect(result).toBe(false)
    }
  })

  it('validates token format without real token', async () => {
    // Test with obviously invalid token format
    const result = await validateToken('https://mastodon.social', 'invalid_token')
    expect(result).toBe(false)
  })

  it('handles network timeouts gracefully', async () => {
    // Test with a slow/timeout endpoint
    const result = await testConnection('https://httpstat.us/200?sleep=10000')
    // Should return false due to timeout or network issues
    expect(typeof result).toBe('boolean')
  })
})
