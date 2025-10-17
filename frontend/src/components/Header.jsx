import { Link, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'

function Header() {
  const location = useLocation()
  const [hasToken, setHasToken] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('mastodon_token')
    const instanceUrl = sessionStorage.getItem('instanceUrl')
    const accessToken = sessionStorage.getItem('accessToken')
    setHasToken(!!(token && (instanceUrl || accessToken)))
  }, [location])

  const homeUrl = hasToken ? '/dashboard' : '/connect'

  return (
    <header className="ved-header-nav" role="banner">
      <div className="ved-container">
        <div className="ved-nav-content">
          <Link to="/" className="ved-nav-brand" aria-label="Vedfolnir home">
            <img src="/logo.png" alt="Vedfolnir logo" className="ved-nav-logo" />
            <span className="ved-nav-title">Vedfolnir</span>
          </Link>
          
          <nav className="ved-nav-links" role="navigation" aria-label="Main navigation">
            <Link 
              to={homeUrl} 
              className={`ved-nav-link ${location.pathname === homeUrl ? 'ved-nav-active' : ''}`}
              aria-current={location.pathname === homeUrl ? 'page' : undefined}
            >
              Home
            </Link>
            {hasToken && (
              <Link 
                to="/dashboard?scan=true" 
                className={`ved-nav-link ${location.pathname === '/dashboard' ? 'ved-nav-active' : ''}`}
                aria-current={location.pathname === '/dashboard' ? 'page' : undefined}
              >
                Scan Posts
              </Link>
            )}
            <Link 
              to="/about" 
              className={`ved-nav-link ${location.pathname === '/about' ? 'ved-nav-active' : ''}`}
              aria-current={location.pathname === '/about' ? 'page' : undefined}
            >
              About
            </Link>
            <Link 
              to="/help" 
              className={`ved-nav-link ${location.pathname === '/help' ? 'ved-nav-active' : ''}`}
              aria-current={location.pathname === '/help' ? 'page' : undefined}
            >
              Help
            </Link>
            <Link 
              to="/" 
              className={`ved-nav-link ${location.pathname === '/' ? 'ved-nav-active' : ''}`}
              aria-current={location.pathname === '/' ? 'page' : undefined}
            >
              Landing
            </Link>
          </nav>
        </div>
      </div>
    </header>
  )
}

export default Header
