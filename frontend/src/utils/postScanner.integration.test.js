import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fetchUserPosts, extractImagesFromPosts, filterPostsWithoutAltText } from './postScanner'

// Mock ActivityPub client with realistic data
vi.mock('./activityPubClient', () => ({
  fetchPosts: vi.fn()
}))

import { fetchPosts } from './activityPubClient'

describe('Post Scanner Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('processes realistic Mastodon post data', async () => {
    const realisticPosts = [
      {
        id: '111234567890123456',
        content: '<p>Check out this photo!</p>',
        media_attachments: [
          {
            id: '111234567890123457',
            type: 'image',
            url: 'https://files.mastodon.social/media_attachments/files/111/234/567/890/123/457/original/abc123.jpg',
            preview_url: 'https://files.mastodon.social/media_attachments/files/111/234/567/890/123/457/small/abc123.jpg',
            description: null
          }
        ]
      },
      {
        id: '111234567890123458',
        content: '<p>Another post with alt text</p>',
        media_attachments: [
          {
            id: '111234567890123459',
            type: 'image',
            url: 'https://files.mastodon.social/media_attachments/files/111/234/567/890/123/459/original/def456.png',
            description: 'A beautiful sunset over the mountains'
          }
        ]
      },
      {
        id: '111234567890123460',
        content: '<p>Text only post</p>',
        media_attachments: []
      }
    ]

    fetchPosts.mockResolvedValue(realisticPosts)

    // Test complete workflow
    const posts = await fetchUserPosts('https://mastodon.social', 'token')
    const images = extractImagesFromPosts(posts)
    const imagesWithoutAlt = filterPostsWithoutAltText(images)

    expect(posts).toHaveLength(3)
    expect(images).toHaveLength(2)
    expect(imagesWithoutAlt).toHaveLength(1)
    expect(imagesWithoutAlt[0]).toEqual({
      postId: '111234567890123456',
      url: 'https://files.mastodon.social/media_attachments/files/111/234/567/890/123/457/original/abc123.jpg',
      description: null
    })
  })

  it('handles mixed media types correctly', () => {
    const postsWithMixedMedia = [
      {
        id: '1',
        media_attachments: [
          { type: 'image', url: 'image1.jpg', description: null },
          { type: 'video', url: 'video1.mp4', description: null },
          { type: 'gifv', url: 'gif1.gif', description: null },
          { type: 'image', url: 'image2.jpg', description: 'Has alt text' }
        ]
      }
    ]

    const images = extractImagesFromPosts(postsWithMixedMedia)
    const imagesWithoutAlt = filterPostsWithoutAltText(images)

    expect(images).toHaveLength(2) // Only images, not video/gifv
    expect(imagesWithoutAlt).toHaveLength(1) // Only image without alt text
  })

  it('handles edge cases in alt text detection', () => {
    const edgeCasePosts = [
      {
        id: '1',
        media_attachments: [
          { type: 'image', url: 'img1.jpg', description: null },
          { type: 'image', url: 'img2.jpg', description: '' },
          { type: 'image', url: 'img3.jpg', description: '   ' },
          { type: 'image', url: 'img4.jpg', description: 'Valid alt text' },
          { type: 'image', url: 'img5.jpg', description: '0' } // Edge case: "0" is valid
        ]
      }
    ]

    const images = extractImagesFromPosts(edgeCasePosts)
    const imagesWithoutAlt = filterPostsWithoutAltText(images)

    expect(images).toHaveLength(5)
    expect(imagesWithoutAlt).toHaveLength(3) // null, empty, whitespace
    expect(imagesWithoutAlt.map(img => img.url)).toEqual([
      'img1.jpg', 'img2.jpg', 'img3.jpg'
    ])
  })
})
