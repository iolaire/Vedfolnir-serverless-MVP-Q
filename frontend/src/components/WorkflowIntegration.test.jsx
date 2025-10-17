import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import Dashboard from './Dashboard'

// Mock utilities
vi.mock('../utils/postScanner', () => ({
  fetchUserPosts: vi.fn(),
  extractImagesFromPosts: vi.fn(),
  filterPostsWithoutAltText: vi.fn()
}))

vi.mock('../utils/postUpdater', () => ({
  updatePostAltText: vi.fn()
}))

// Mock environment variables
vi.mock('import.meta', () => ({
  env: {
    VITE_LAMBDA_URL: 'https://test-lambda.aws/',
    VITE_API_KEY: 'test-key'
  }
}))

global.fetch = vi.fn()
global.sessionStorage = {
  getItem: vi.fn(),
  setItem: vi.fn()
}
global.localStorage = {
  getItem: vi.fn(),
  setItem: vi.fn()
}
global.alert = vi.fn()

describe('Complete Workflow Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.getItem.mockImplementation((key) => {
      if (key === 'mastodon_token') return 'encrypted-token'
      return null
    })
    sessionStorage.getItem.mockImplementation((key) => {
      if (key === 'instanceUrl') return 'https://mastodon.social'
      if (key === 'accessToken') return 'test-token'
      return null
    })
    
    // Mock fetch with proper blob response
    fetch.mockImplementation((url) => {
      if (url.includes('test.jpg')) {
        return Promise.resolve({
          ok: true,
          blob: () => Promise.resolve(new Blob(['fake-image-data'], { type: 'image/jpeg' }))
        })
      }
      if (url.includes('lambda')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ altText: 'Test alt text' })
        })
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ altText: 'Test alt text' })
      })
    })
  })

  const renderDashboard = () => {
    return render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    )
  }

  describe('Complete User Journey', () => {
    it('should handle complete workflow from scan to approval', async () => {
      const { fetchUserPosts, extractImagesFromPosts, filterPostsWithoutAltText } = await import('../utils/postScanner')
      const { updatePostAltText } = await import('../utils/postUpdater')

      // Mock the complete workflow
      const mockPosts = [{ id: '1', media_attachments: [{ id: 'm1', type: 'image', url: 'test.jpg', description: null }] }]
      const mockImages = [{ postId: '1', mediaId: 'm1', url: 'test.jpg', description: null }]
      const mockImagesWithoutAlt = [{ postId: '1', mediaId: 'm1', url: 'test.jpg', description: null }]

      fetchUserPosts.mockResolvedValue(mockPosts)
      extractImagesFromPosts.mockReturnValue(mockImages)
      filterPostsWithoutAltText.mockReturnValue(mockImagesWithoutAlt)
      updatePostAltText.mockResolvedValue({ success: true })

      // Mock fetch for alt text generation
      fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ alt_text: 'Generated alt text' })
      })

      renderDashboard()

      // Step 1: Scan posts
      const scanButton = screen.getByText('Scan My Posts')
      fireEvent.click(scanButton)

      await waitFor(() => {
        expect(screen.getByText('Scan Results')).toBeInTheDocument()
      })

      // Step 2: Generate alt text
      const generateButton = screen.getByText('Generate Alt Text')
      fireEvent.click(generateButton)

      await waitFor(() => {
        expect(screen.getByText(/Generated Alt Text/)).toBeInTheDocument()
      })

      // Step 3: Show review interface
      const reviewButton = screen.getByText('Show Review Interface')
      fireEvent.click(reviewButton)

      await waitFor(() => {
        expect(screen.getByText('Review Interface')).toBeInTheDocument()
      })

      // Step 4: Approve alt text
      const approveButton = screen.getByText('Approve')
      fireEvent.click(approveButton)

      await waitFor(() => {
        expect(updatePostAltText).toHaveBeenCalledWith(
          'https://mastodon.social',
          'test-token',
          '1',
          'm1',
          'Generated alt text'
        )
      })
    })

    it('should handle error recovery throughout workflow', async () => {
      const { fetchUserPosts } = await import('../utils/postScanner')
      
      // Mock network error
      fetchUserPosts.mockRejectedValue(new Error('Network error'))

      renderDashboard()

      const scanButton = screen.getByText('Scan My Posts')
      fireEvent.click(scanButton)

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument()
      })

      // Verify error state doesn't break the app
      expect(scanButton).toBeInTheDocument()
    })

    it('should maintain state management across workflow steps', async () => {
      const { fetchUserPosts, extractImagesFromPosts, filterPostsWithoutAltText } = await import('../utils/postScanner')

      const mockPosts = [{ id: '1', media_attachments: [{ id: 'm1', type: 'image', url: 'test.jpg', description: null }] }]
      const mockImages = [{ postId: '1', mediaId: 'm1', url: 'test.jpg', description: null }]

      fetchUserPosts.mockResolvedValue(mockPosts)
      extractImagesFromPosts.mockReturnValue(mockImages)
      filterPostsWithoutAltText.mockReturnValue(mockImages)

      renderDashboard()

      // Scan posts
      fireEvent.click(screen.getByText('Scan My Posts'))

      await waitFor(() => {
        expect(screen.getByText(/Posts scanned:/)).toBeInTheDocument()
        expect(screen.getAllByText('1')).toHaveLength(3) // Posts, Images, Images without alt
        expect(screen.getByText(/Images found:/)).toBeInTheDocument()
        expect(screen.getByText(/Images without alt text:/)).toBeInTheDocument()
      })

      // State should persist when toggling review interface
      fireEvent.click(screen.getByText('Show Review Interface'))
      fireEvent.click(screen.getByText('Hide Review Interface'))
      
      // Scan results should still be visible
      expect(screen.getByText(/Posts scanned:/)).toBeInTheDocument()
    })
  })

  describe('Loading States', () => {
    it('should show loading states during scan', async () => {
      const { fetchUserPosts } = await import('../utils/postScanner')
      
      // Mock slow response
      fetchUserPosts.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))

      renderDashboard()

      const scanButton = screen.getByText('Scan My Posts')
      fireEvent.click(scanButton)

      expect(screen.getByText('Scanning Your Posts...')).toBeInTheDocument()
      expect(scanButton).toBeDisabled()
    })

    it('should show loading states during alt text generation', async () => {
      const { fetchUserPosts, extractImagesFromPosts, filterPostsWithoutAltText } = await import('../utils/postScanner')

      const mockPosts = [{ id: '1', media_attachments: [{ id: 'm1', type: 'image', url: 'test.jpg', description: null }] }]
      const mockImages = [{ postId: '1', mediaId: 'm1', url: 'test.jpg', description: null }]

      fetchUserPosts.mockResolvedValue(mockPosts)
      extractImagesFromPosts.mockReturnValue(mockImages)
      filterPostsWithoutAltText.mockReturnValue(mockImages)

      // Mock slow fetch for alt text generation
      fetch.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))

      renderDashboard()

      // Scan first
      fireEvent.click(screen.getByText('Scan My Posts'))
      await waitFor(() => screen.getByText('Generate Alt Text'))

      // Generate alt text
      const generateButton = screen.getByText('Generate Alt Text')
      fireEvent.click(generateButton)

      expect(screen.getByText('Generating...')).toBeInTheDocument()
      expect(generateButton).toBeDisabled()
    })
  })

  describe('Error Handling', () => {
    it('should handle alt text generation failures gracefully', async () => {
      const { fetchUserPosts, extractImagesFromPosts, filterPostsWithoutAltText } = await import('../utils/postScanner')

      const mockPosts = [{ id: '1', media_attachments: [{ id: 'm1', type: 'image', url: 'test.jpg', description: null }] }]
      const mockImages = [{ postId: '1', mediaId: 'm1', url: 'test.jpg', description: null }]

      fetchUserPosts.mockResolvedValue(mockPosts)
      extractImagesFromPosts.mockReturnValue(mockImages)
      filterPostsWithoutAltText.mockReturnValue(mockImages)

      // Mock fetch failure
      fetch.mockResolvedValue({
        ok: false,
        json: async () => ({ error: 'AI service unavailable' })
      })

      // Mock alert
      window.alert = vi.fn()

      renderDashboard()

      // Scan and generate
      fireEvent.click(screen.getByText('Scan My Posts'))
      await waitFor(() => screen.getByText('Generate Alt Text'))
      
      fireEvent.click(screen.getByText('Generate Alt Text'))

      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith(expect.stringContaining('Error generating alt text'))
      })
    })

    it('should handle post update failures gracefully', async () => {
      const { fetchUserPosts, extractImagesFromPosts, filterPostsWithoutAltText } = await import('../utils/postScanner')
      const { updatePostAltText } = await import('../utils/postUpdater')

      const mockPosts = [{ id: '1', media_attachments: [{ id: 'm1', type: 'image', url: 'test.jpg', description: null }] }]
      const mockImages = [{ postId: '1', mediaId: 'm1', url: 'test.jpg', description: null, generatedAltText: 'Test alt text' }]

      fetchUserPosts.mockResolvedValue(mockPosts)
      extractImagesFromPosts.mockReturnValue(mockImages)
      filterPostsWithoutAltText.mockReturnValue(mockImages)
      updatePostAltText.mockResolvedValue({ success: false, error: 'Rate limited' })

      window.alert = vi.fn()

      renderDashboard()

      // Scan, show review interface, and approve
      fireEvent.click(screen.getByText('Scan My Posts'))
      await waitFor(() => screen.getByText('Show Review Interface'))
      
      fireEvent.click(screen.getByText('Show Review Interface'))
      await waitFor(() => screen.getByText('Approve'))
      
      fireEvent.click(screen.getByText('Approve'))

      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith('Failed to update alt text: Rate limited')
      })
    })
  })
})
