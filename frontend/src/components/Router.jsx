import { Routes, Route, Link } from 'react-router-dom'
import Header from './Header'
import LandingPage from './LandingPage'
import About from './About'
import Help from './Help'
import TokenInput from './TokenInput'
import Dashboard from './Dashboard'
import Legal from './Legal'

function Router() {
  return (
    <>
      <a href="#main-content" className="ved-skip-link">Skip to main content</a>
      <Header />
      <main id="main-content">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/about" element={<About />} />
          <Route path="/help" element={<Help />} />
          <Route path="/connect" element={<TokenInput />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/legal" element={<Legal />} />
        </Routes>
      </main>
      
      {/* Global Footer */}
      <footer style={{ 
        marginTop: '48px', 
        paddingTop: '24px', 
        paddingBottom: '24px',
        borderTop: '1px solid var(--ved-border)',
        textAlign: 'center',
        fontSize: '14px',
        color: 'var(--ved-text-secondary)',
        background: 'var(--ved-surface)'
      }}>
        <p style={{ margin: '0 0 8px 0' }}>© 2025 iolaire mcfadden. Licensed under AGPL v3+.</p>
        <p style={{ margin: '0' }}>
          <Link 
            to="/legal" 
            style={{ 
              color: 'var(--ved-primary)', 
              textDecoration: 'none',
              fontWeight: '500'
            }}
            onMouseOver={(e) => e.target.style.textDecoration = 'underline'}
            onMouseOut={(e) => e.target.style.textDecoration = 'none'}
          >
            Privacy & Terms
          </Link>
        </p>
      </footer>
    </>
  )
}

export default Router
