import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import Router from './Router'

describe('Router', () => {
  it('renders login page by default', () => {
    render(
      <MemoryRouter initialEntries={['/']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Router />
      </MemoryRouter>
    )
    expect(screen.getByText(/token/i)).toBeInTheDocument()
  })

  it('renders dashboard when authenticated', () => {
    render(
      <MemoryRouter initialEntries={['/dashboard']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Router />
      </MemoryRouter>
    )
    expect(screen.getByText(/scan/i)).toBeInTheDocument()
  })
})
