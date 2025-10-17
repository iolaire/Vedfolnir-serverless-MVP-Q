import { describe, it, expect, vi, beforeEach } from 'vitest'
import { updatePostAltText, updateMultiplePosts } from './postUpdater'

// Mock fetch
global.fetch = vi.fn()

describe('ActivityPub Post Updates', () => {
  beforeEach(() => {
    fetch.mockClear()
  })

  describe('updatePostAltText', () => {
    it('should format PUT request correctly', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ id: '123', media_attachments: [{ description: 'New alt text' }] })
      })

      const result = await updatePostAltText(
        'https://mastodon.social',
        'test-token',
        '123',
        'media-456',
        'New alt text'
      )

      expect(fetch).toHaveBeenCalledWith(
        'https://mastodon.social/api/v1/media/media-456',
        {
          method: 'PUT',
          headers: {
            'Authorization': 'Bearer test-token',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ description: 'New alt text' })
        }
      )
      expect(result.success).toBe(true)
    })

    it('should implement retry logic with 1s delay', async () => {
      fetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ id: '123' })
        })

      const startTime = Date.now()
      const result = await updatePostAltText(
        'https://mastodon.social',
        'test-token',
        '123',
        'media-456',
        'Alt text'
      )
      const endTime = Date.now()

      expect(result.success).toBe(true)
      expect(endTime - startTime).toBeGreaterThan(1000) // At least 1s delay
      expect(fetch).toHaveBeenCalledTimes(2)
    })

    it('should fail after 2 retry attempts', async () => {
      fetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))

      const result = await updatePostAltText(
        'https://mastodon.social',
        'test-token',
        '123',
        'media-456',
        'Alt text'
      )

      expect(result.success).toBe(false)
      expect(result.error).toContain('Failed after 2 attempts')
      expect(fetch).toHaveBeenCalledTimes(2)
    })

    it('should handle rate limiting with proper delay', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        headers: new Map([['retry-after', '5']])
      })

      const result = await updatePostAltText(
        'https://mastodon.social',
        'test-token',
        '123',
        'media-456',
        'Alt text'
      )

      expect(result.success).toBe(false)
      expect(result.error).toContain('Rate limited')
    })
  })

  describe('updateMultiplePosts', () => {
    it('should implement 1 req/sec rate limiting', async () => {
      fetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ id: '123' })
      })

      const posts = [
        { postId: '1', mediaId: 'm1', altText: 'Alt 1' },
        { postId: '2', mediaId: 'm2', altText: 'Alt 2' },
        { postId: '3', mediaId: 'm3', altText: 'Alt 3' }
      ]

      const startTime = Date.now()
      const results = await updateMultiplePosts(
        'https://mastodon.social',
        'test-token',
        posts
      )
      const endTime = Date.now()

      expect(results).toHaveLength(3)
      expect(endTime - startTime).toBeGreaterThan(2000) // At least 2s for 3 requests
      expect(fetch).toHaveBeenCalledTimes(3)
    })

    it('should continue processing after individual failures', async () => {
      fetch
        .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ id: '1' }) })
        .mockRejectedValueOnce(new Error('Failed'))
        .mockRejectedValueOnce(new Error('Failed again'))
        .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ id: '3' }) })

      const posts = [
        { postId: '1', mediaId: 'm1', altText: 'Alt 1' },
        { postId: '2', mediaId: 'm2', altText: 'Alt 2' },
        { postId: '3', mediaId: 'm3', altText: 'Alt 3' }
      ]

      const results = await updateMultiplePosts(
        'https://mastodon.social',
        'test-token',
        posts
      )

      expect(results[0].success).toBe(true)
      expect(results[1].success).toBe(false)
      expect(results[2].success).toBe(true)
    })

    it('should provide progress callback updates', async () => {
      fetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ id: '123' })
      })

      const progressCallback = vi.fn()
      const posts = [
        { postId: '1', mediaId: 'm1', altText: 'Alt 1' },
        { postId: '2', mediaId: 'm2', altText: 'Alt 2' }
      ]

      await updateMultiplePosts(
        'https://mastodon.social',
        'test-token',
        posts,
        progressCallback
      )

      expect(progressCallback).toHaveBeenCalledWith(0, 2)
      expect(progressCallback).toHaveBeenCalledWith(1, 2)
      expect(progressCallback).toHaveBeenCalledWith(2, 2)
    })
  })
})
