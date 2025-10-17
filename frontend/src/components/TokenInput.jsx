import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { generateKey, encryptToken } from '../utils/crypto'
import { saveToken } from '../utils/localStorage'
import { sanitizeToken, sanitizeUrl } from '../utils/inputSanitizer'
import { detectPlatform } from '../utils/postScanner'

function TokenInput() {
  const [instanceUrl, setInstanceUrl] = useState('https://masto.ai')
  const [accessToken, setAccessToken] = useState('')
  const [showToken, setShowToken] = useState(false)
  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setSuccess(false)
    
    const newErrors = {}
    
    // Validate required fields
    if (!instanceUrl.trim()) {
      newErrors.instanceUrl = 'Instance URL is required'
    }
    if (!accessToken.trim()) {
      newErrors.accessToken = 'Access token is required'
    }
    
    // Validate URL format (only if URL is provided)
    if (instanceUrl.trim()) {
      const sanitizedUrl = sanitizeUrl(instanceUrl)
      if (!sanitizedUrl) {
        newErrors.instanceUrl = 'Invalid URL'
      }
    }
    
    setErrors(newErrors)
    
    // If no errors, save token
    if (Object.keys(newErrors).length === 0) {
      try {
        const key = await generateKey()
        const sanitizedToken = sanitizeToken(accessToken)
        const sanitizedInstanceUrl = sanitizeUrl(instanceUrl)
        const encrypted = await encryptToken(sanitizedToken, key)
        saveToken(encrypted)
        
        // Also store in sessionStorage for Dashboard access
        sessionStorage.setItem('instanceUrl', sanitizedInstanceUrl)
        sessionStorage.setItem('accessToken', sanitizedToken)
        
        // Detect and store platform
        try {
          const platform = await detectPlatform(sanitizedInstanceUrl, sanitizedToken)
          sessionStorage.setItem('platform', platform)
          console.log('Detected platform:', platform)
        } catch (error) {
          console.log('Platform detection failed, defaulting to mastodon')
          sessionStorage.setItem('platform', 'mastodon')
        }
        
        setSuccess(true)
        console.log('Token saved successfully!')
        
        // Navigate to dashboard after 1 second
        setTimeout(() => {
          navigate('/dashboard')
        }, 1000)
      } catch (error) {
        console.error('Failed to save token:', error)
        setErrors({ general: 'Failed to save token' })
      }
    }
    
    setIsLoading(false)
  }

  const goToDashboard = () => {
    navigate('/dashboard')
  }

  return (
    <div className="ved-login-container">
      <div className="ved-login-card">
        <img 
          src="/logo.png" 
          alt="Vedfolnir Logo" 
          className="ved-login-logo"
        />
        <h1 className="ved-login-title">Vedfolnir</h1>
        <p className="ved-login-subtitle">Connect your ActivityPub or Pixelfed instance to generate alt text for images</p>
        
        <form onSubmit={handleSubmit} noValidate>
          <div className="ved-form-group">
            <label htmlFor="instanceUrl" className="ved-label">
              Instance URL
            </label>
            <input
              id="instanceUrl"
              type="url"
              value={instanceUrl}
              onChange={(e) => setInstanceUrl(e.target.value)}
              placeholder="https://masto.ai"
              className="ved-input"
              disabled={success}
              autoComplete="url"
              aria-describedby={errors.instanceUrl ? "instanceUrl-error" : undefined}
              aria-invalid={errors.instanceUrl ? "true" : "false"}
              required
            />
            {errors.instanceUrl && (
              <div id="instanceUrl-error" className="ved-error" role="alert" style={{ marginTop: '8px', padding: '8px' }}>
                {errors.instanceUrl}
              </div>
            )}
          </div>
          
          <div className="ved-form-group">
            <label htmlFor="accessToken" className="ved-label">
              Access Token
            </label>
            <div style={{ position: 'relative', width: '100%' }}>
              <input
                id="accessToken"
                type={showToken ? 'text' : 'password'}
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                placeholder="Your ActivityPub or Pixelfed access token"
                className="ved-input ved-input-token"
                disabled={success}
                autoComplete="off"
                aria-describedby={errors.accessToken ? "accessToken-error" : undefined}
                aria-invalid={errors.accessToken ? "true" : "false"}
                required
              />
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                className="ved-show-password-btn"
                aria-label={showToken ? 'Hide token' : 'Show token'}
              >
                {showToken ? '🙈' : '👁️'}
              </button>
            </div>
            {errors.accessToken && (
              <div id="accessToken-error" className="ved-error" role="alert" style={{ marginTop: '8px', padding: '8px' }}>
                {errors.accessToken}
              </div>
            )}
          </div>
          
          {errors.general && (
            <div className="ved-error" role="alert">
              {errors.general}
            </div>
          )}
          
          {success && (
            <div className="ved-success">
              Token saved successfully! Redirecting to dashboard...
            </div>
          )}
          
          {!success && (
            <button 
              type="submit" 
              disabled={isLoading}
              className="ved-button"
              style={{ width: '100%' }}
            >
              {isLoading && <div className="ved-spinner"></div>}
              {isLoading ? 'Saving...' : 'Connect'}
            </button>
          )}
          
          {success && (
            <button 
              type="button"
              onClick={goToDashboard}
              className="ved-button"
              style={{ width: '100%' }}
            >
              Go to Dashboard
            </button>
          )}
        </form>
      </div>
    </div>
  )
}

export default TokenInput
