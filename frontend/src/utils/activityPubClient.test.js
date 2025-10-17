import { describe, it, expect, vi, beforeEach } from 'vitest'
import { validateToken, testConnection, fetchPosts } from './activityPubClient'

// Mock fetch
global.fetch = vi.fn()

describe('ActivityPub Client', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('validateToken', () => {
    it('validates token with successful API call', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: '123', username: 'testuser' })
      })

      const result = await validateToken('https://mastodon.social', 'valid_token')
      
      expect(result).toBe(true)
      expect(fetch).toHaveBeenCalledWith(
        'https://mastodon.social/api/v1/accounts/verify_credentials',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer valid_token'
          })
        })
      )
    })

    it('rejects invalid token', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 401
      })

      const result = await validateToken('https://mastodon.social', 'invalid_token')
      
      expect(result).toBe(false)
    })

    it('handles network errors', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'))

      const result = await validateToken('https://mastodon.social', 'token')
      
      expect(result).toBe(false)
    })
  })

  describe('testConnection', () => {
    it('tests connection successfully', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ version: '4.0.0' })
      })

      const result = await testConnection('https://mastodon.social')
      
      expect(result).toBe(true)
      expect(fetch).toHaveBeenCalledWith('https://mastodon.social/api/v1/instance')
    })

    it('handles connection failure', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 500
      })

      const result = await testConnection('https://mastodon.social')
      
      expect(result).toBe(false)
    })
  })

  describe('fetchPosts', () => {
    it('fetches posts from outbox', async () => {
      const mockPosts = [
        { id: '1', content: 'Test post 1', media_attachments: [] },
        { id: '2', content: 'Test post 2', media_attachments: [{ type: 'image', url: 'test.jpg' }] }
      ]

      // Mock verify_credentials call
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: '123', username: 'testuser' })
      })

      // Mock statuses call
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockPosts)
      })

      const result = await fetchPosts('https://mastodon.social', 'token')
      
      expect(result).toEqual(mockPosts)
      expect(fetch).toHaveBeenCalledTimes(2)
      expect(fetch).toHaveBeenNthCalledWith(1,
        'https://mastodon.social/api/v1/accounts/verify_credentials',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer token'
          })
        })
      )
    })

    it('handles fetch error', async () => {
      fetch.mockRejectedValueOnce(new Error('Fetch failed'))

      const result = await fetchPosts('https://mastodon.social', 'token')
      
      expect(result).toEqual([])
    })
  })
})
