// Input sanitization utilities

export function sanitizeToken(token) {
  if (!token || typeof token !== 'string') {
    return ''
  }
  return token.trim()
}

export function sanitizeUrl(url) {
  if (!url || typeof url !== 'string') {
    return ''
  }
  
  const trimmed = url.trim()
  
  // Basic URL validation
  try {
    const parsed = new URL(trimmed)
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
      // Remove trailing slash to fix API endpoint issues
      return trimmed.replace(/\/$/, '')
    }
  } catch {
    // Invalid URL
  }
  
  return ''
}
