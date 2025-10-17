import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fetchUserPosts, extractImagesFromPosts, filterPostsWithoutAltText } from './postScanner'

// Mock ActivityPub client
vi.mock('./activityPubClient', () => ({
  fetchPosts: vi.fn()
}))

import { fetchPosts } from './activityPubClient'

describe('Post Scanner', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('fetchUserPosts', () => {
    it('fetches last 20 posts from user outbox', async () => {
      const mockPosts = [
        { id: '1', content: 'Post 1' },
        { id: '2', content: 'Post 2' }
      ]
      
      fetchPosts.mockResolvedValue(mockPosts)
      
      const result = await fetchUserPosts('https://mastodon.social', 'token')
      
      expect(result).toEqual(mockPosts)
      expect(fetchPosts).toHaveBeenCalledWith('https://mastodon.social', 'token')
    })

    it('handles fetch errors', async () => {
      fetchPosts.mockRejectedValue(new Error('Network error'))
      
      const result = await fetchUserPosts('https://mastodon.social', 'token')
      
      expect(result).toEqual([])
    })
  })

  describe('extractImagesFromPosts', () => {
    it('extracts images from media attachments', () => {
      const posts = [
        {
          id: '1',
          media_attachments: [
            { type: 'image', url: 'https://example.com/image1.jpg', description: null },
            { type: 'video', url: 'https://example.com/video.mp4' }
          ]
        },
        {
          id: '2',
          media_attachments: [
            { type: 'image', url: 'https://example.com/image2.png', description: 'Has alt text' }
          ]
        }
      ]
      
      const result = extractImagesFromPosts(posts)
      
      expect(result).toEqual([
        { postId: '1', url: 'https://example.com/image1.jpg', description: null },
        { postId: '2', url: 'https://example.com/image2.png', description: 'Has alt text' }
      ])
    })

    it('handles posts without media attachments', () => {
      const posts = [
        { id: '1', content: 'Text only post' },
        { id: '2', media_attachments: [] }
      ]
      
      const result = extractImagesFromPosts(posts)
      
      expect(result).toEqual([])
    })
  })

  describe('filterPostsWithoutAltText', () => {
    it('filters images without alt text', () => {
      const images = [
        { postId: '1', url: 'image1.jpg', description: null },
        { postId: '2', url: 'image2.jpg', description: '' },
        { postId: '3', url: 'image3.jpg', description: 'Has alt text' },
        { postId: '4', url: 'image4.jpg', description: '   ' }
      ]
      
      const result = filterPostsWithoutAltText(images)
      
      expect(result).toEqual([
        { postId: '1', url: 'image1.jpg', description: null },
        { postId: '2', url: 'image2.jpg', description: '' },
        { postId: '4', url: 'image4.jpg', description: '   ' }
      ])
    })

    it('returns empty array when all images have alt text', () => {
      const images = [
        { postId: '1', url: 'image1.jpg', description: 'Alt text 1' },
        { postId: '2', url: 'image2.jpg', description: 'Alt text 2' }
      ]
      
      const result = filterPostsWithoutAltText(images)
      
      expect(result).toEqual([])
    })
  })
})
