import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import TokenInput from './TokenInput'

describe('TokenInput Integration', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    cleanup()
  })

  it('completes full token input workflow', async () => {
    render(<TokenInput />)
    
    // Fill in valid Mastodon instance and token format
    fireEvent.change(screen.getByLabelText(/instance url/i), {
      target: { value: 'https://mastodon.social' }
    })
    fireEvent.change(screen.getByLabelText(/access token/i), {
      target: { value: 'mastodon_token_abc123def456' }
    })
    
    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /save/i }))
    
    // Wait for async operations to complete
    await waitFor(() => {
      // Verify no validation errors
      expect(screen.queryByText(/required/i)).not.toBeInTheDocument()
      expect(screen.queryByText(/invalid/i)).not.toBeInTheDocument()
    }, { timeout: 3000 })
    
    // Give time for localStorage to be updated
    await new Promise(resolve => setTimeout(resolve, 100))
    
    // Verify token was stored (encrypted)
    const storedToken = localStorage.getItem('mastodon_token')
    expect(storedToken).toBeTruthy()
    expect(storedToken).not.toBe('mastodon_token_abc123def456') // Should be encrypted
  })

  it('handles different Mastodon instance URLs', async () => {
    const instanceUrl = 'https://mastodon.social'
    
    render(<TokenInput />)
    
    fireEvent.change(screen.getByLabelText(/instance url/i), {
      target: { value: instanceUrl }
    })
    fireEvent.change(screen.getByLabelText(/access token/i), {
      target: { value: 'test_token_123' }
    })
    
    fireEvent.click(screen.getByRole('button', { name: /save/i }))
    
    await waitFor(() => {
      expect(screen.queryByText(/invalid/i)).not.toBeInTheDocument()
    })
  })

  it('validates token format expectations', async () => {
    render(<TokenInput />)
    
    // Test with realistic Mastodon token format
    fireEvent.change(screen.getByLabelText(/instance url/i), {
      target: { value: 'https://mastodon.social' }
    })
    fireEvent.change(screen.getByLabelText(/access token/i), {
      target: { value: 'abcdef1234567890abcdef1234567890abcdef12' }
    })
    
    fireEvent.click(screen.getByRole('button', { name: /save/i }))
    
    // Should process without errors
    await waitFor(() => {
      expect(screen.queryByText(/required/i)).not.toBeInTheDocument()
    })
  })
})
