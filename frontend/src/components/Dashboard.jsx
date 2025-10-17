/*
 * Copyright (C) 2025 iolaire mcfadden
 * 
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

import { useState, useRef, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { fetchUserPosts, extractImagesFromPosts, filterPostsWithoutAltText } from '../utils/postScanner'
import { updatePostByPlatform } from '../utils/postUpdater'
import ReviewPopup from './ReviewPopup'
import FlashMessage from './FlashMessage'

const FUNCTION_URL = window.LAMBDA_URL

function Dashboard() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [isScanning, setIsScanning] = useState(false)
  const [scanResults, setScanResults] = useState(null)
  const [error, setError] = useState(null)
  const [generatingFor, setGeneratingFor] = useState(null)
  const [reviewPopup, setReviewPopup] = useState(null)
  const [flashMessage, setFlashMessage] = useState(null)
  const buttonRefs = useRef({})

  // Redirect to login if not authenticated
  useEffect(() => {
    const encryptedToken = localStorage.getItem('mastodon_token')
    const instanceUrl = sessionStorage.getItem('instanceUrl')
    const accessToken = sessionStorage.getItem('accessToken')
    
    if (!encryptedToken || !instanceUrl || !accessToken) {
      navigate('/')
    }
  }, [navigate])

  const handleUpdateAltText = (index, newAltText) => {
    const updatedImages = [...scanResults.images]
    updatedImages[index] = { ...updatedImages[index], generatedAltText: newAltText }
    setScanResults({ ...scanResults, images: updatedImages })
  }

  const handleApprove = async (imageOrIndex) => {
    // Handle both image object (from review interface) and index (from main interface)
    const image = typeof imageOrIndex === 'object' ? imageOrIndex : scanResults.images[imageOrIndex]
    const instanceUrl = sessionStorage.getItem('instanceUrl')
    const accessToken = sessionStorage.getItem('accessToken')
    
    if (!image.generatedAltText) {
      alert('No alt text to approve')
      return
    }
    
    try {
      console.log('Updating post with alt text:', image.generatedAltText)
      
      const platform = sessionStorage.getItem('platform') || 'mastodon'
      const result = await updatePostByPlatform(
        platform,
        instanceUrl,
        accessToken,
        image.postId,
        image.mediaId,
        image.generatedAltText
      )
      
      if (result.success) {
        setFlashMessage({ text: 'Alt text updated successfully!', type: 'success' })
        // Remove from review list - find by postId and mediaId
        const updatedImages = scanResults.images.filter(img => 
          !(img.postId === image.postId && img.mediaId === image.mediaId)
        )
        setScanResults({ ...scanResults, images: updatedImages })
        setReviewPopup(null)
      } else {
        setFlashMessage({ text: `Failed to update alt text: ${result.error}`, type: 'error' })
      }
    } catch (error) {
      console.error('Error updating post:', error)
      setFlashMessage({ text: `Error updating post: ${error.message}`, type: 'error' })
    }
  }

  const handleReject = (imageOrIndex) => {
    // Handle both image object (from review interface) and index (from main interface)
    const image = typeof imageOrIndex === 'object' ? imageOrIndex : scanResults.images[imageOrIndex]
    console.log('Rejected image:', image)
    // Remove from review list - find by postId and mediaId
    const updatedImages = scanResults.images.filter(img => 
      !(img.postId === image.postId && img.mediaId === image.mediaId)
    )
    setScanResults({ ...scanResults, images: updatedImages })
    setReviewPopup(null)
  }

  // Shared function to process image locally and convert to base64
  const processImageLocally = async (imageUrl) => {
    console.log('Processing image locally and converting to base64')
    
    // Fetch the image and convert to base64 JPEG
    const imageResponse = await fetch(imageUrl)
    const imageBlob = await imageResponse.blob()
    
    // Convert to JPEG format using canvas
    const base64 = await new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        
        // Set canvas size (max 1024px as per our image processing requirements)
        const maxSize = 1024
        let { width, height } = img
        
        if (width > maxSize || height > maxSize) {
          if (width > height) {
            height = (height * maxSize) / width
            width = maxSize
          } else {
            width = (width * maxSize) / height
            height = maxSize
          }
        }
        
        canvas.width = width
        canvas.height = height
        
        // Draw image and convert to JPEG
        ctx.drawImage(img, 0, 0, width, height)
        const base64Data = canvas.toDataURL('image/jpeg', 0.8).split(',')[1]
        resolve(base64Data)
      }
      
      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = URL.createObjectURL(imageBlob)
    })
    
    return base64
  }

  const generateAltText = async (image, index) => {
    setGeneratingFor(index)
    
    try {
      const platform = sessionStorage.getItem('platform') || 'mastodon'
      
      console.log(`Processing image for ${platform} platform`)
      
      let requestBody
      
      if (platform === 'pixelfed') {
        // Send URL to backend for server-side processing
        requestBody = { image_url: image.url }
      } else {
        // Process locally for Mastodon (CORS-enabled)
        const base64Data = await processImageLocally(image.url)
        requestBody = { image_data: base64Data }
      }

      const response = await fetch(FUNCTION_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      })
      
      const result = await response.json()
      
      if (response.ok) {
        // Update the image with generated alt text
        const updatedImages = [...scanResults.images]
        updatedImages[index] = { ...image, generatedAltText: result.alt_text }
        setScanResults({ ...scanResults, images: updatedImages })
        
        // Show review popup next to the button
        const buttonElement = buttonRefs.current[index]
        if (buttonElement) {
          const rect = buttonElement.getBoundingClientRect()
          const containerRect = buttonElement.offsetParent.getBoundingClientRect()
          setReviewPopup({
            image: updatedImages[index],
            index,
            position: {
              top: rect.bottom - containerRect.top + 10,
              left: rect.left - containerRect.left
            }
          })
        }
      } else {
        console.error('Error generating alt text:', result)
        alert(`Error generating alt text: ${result.error || result.details || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error generating alt text:', error)
      alert(`Error generating alt text: ${error.message}`)
    } finally {
      setGeneratingFor(null)
    }
  }

  const handleScan = async () => {
    setIsScanning(true)
    setError(null)
    
    try {
      // Get stored encrypted token
      const encryptedToken = localStorage.getItem('mastodon_token')
      
      if (!encryptedToken) {
        throw new Error('Please login first')
      }

      // For now, we'll need to get the plain credentials
      // This is a temporary solution - in production we'd decrypt properly
      const instanceUrl = sessionStorage.getItem('instanceUrl')
      const accessToken = sessionStorage.getItem('accessToken')
      
      if (!instanceUrl || !accessToken) {
        throw new Error('Session expired. Please login again.')
      }

      console.log('Starting post scan for:', instanceUrl)
      
      const posts = await fetchUserPosts(instanceUrl, accessToken)
      console.log('Fetched posts:', posts.length)
      
      const images = extractImagesFromPosts(posts)
      console.log('Extracted images:', images.length)
      
      const imagesWithoutAlt = filterPostsWithoutAltText(images)
      console.log('Images without alt text:', imagesWithoutAlt.length)
      
      const results = {
        totalPosts: posts.length,
        imagesFound: images.length,
        imagesWithoutAlt: imagesWithoutAlt.length,
        images: imagesWithoutAlt
      }
      
      console.log('Scan completed:', results)
      setScanResults(results)
      
    } catch (error) {
      console.error('Scan error:', error)
      setError(error.message)
    } finally {
      setIsScanning(false)
    }
  }

  // Auto-trigger scan if scan=true parameter is present
  useEffect(() => {
    if (searchParams.get('scan') === 'true') {
      // Clear the parameter and trigger scan
      setSearchParams({})
      handleScan()
    }
  }, [searchParams, setSearchParams])

  const goBack = () => {
    window.location.href = '/connect'
  }

  return (
    <div className="ved-container">
      <div className="ved-card">
        <div style={{ marginBottom: '20px' }}>
          <button 
            onClick={goBack}
            className="ved-button ved-button-secondary"
          >
            ← Back to Login
          </button>
        </div>

        {!scanResults && (
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <h3>Scan Your Posts</h3>
            <p style={{ color: 'var(--ved-text-secondary)', marginBottom: '24px' }}>
              Click below to scan your recent posts for images without alt text.
            </p>
            
            <button 
              onClick={handleScan}
              disabled={isScanning}
              className="ved-button"
              style={{ fontSize: '18px', padding: '16px 32px' }}
            >
              {isScanning && <div className="ved-spinner"></div>}
              {isScanning ? 'Scanning Your Posts...' : 'Scan My Posts'}
            </button>
          </div>
        )}

        {error && (
          <div className="ved-error">
            {error}
          </div>
        )}

        {scanResults && (
          <div>
            <h3>Scan Results</h3>
            
            <div className="ved-stats">
              <div className="ved-stat">
                <span className="ved-stat-number">{scanResults.totalPosts}</span>
                <span className="ved-stat-label">Posts Scanned</span>
              </div>
              <div className="ved-stat">
                <span className="ved-stat-number">{scanResults.imagesFound}</span>
                <span className="ved-stat-label">Images Found</span>
              </div>
              <div className="ved-stat">
                <span className="ved-stat-number">{scanResults.imagesWithoutAlt}</span>
                <span className="ved-stat-label">Need Alt Text</span>
              </div>
            </div>

            {scanResults.images.length > 0 ? (
              <div>
                <h4>Images Needing Alt Text:</h4>
                <div className="ved-image-grid">
                  {scanResults.images.map((image, index) => (
                    <div key={`${image.postId}-${image.mediaId}`} className="ved-post-card">
                      <div className="ved-image-item">
                        <img 
                          src={image.url} 
                          alt={image.generatedAltText || `Image from post ${image.postId} awaiting alt text generation`}
                          className="ved-image"
                          onError={(e) => {
                            e.target.style.display = 'none'
                            e.target.nextSibling.style.display = 'block'
                          }}
                        />
                        <div style={{ 
                          display: 'none', 
                          padding: '20px', 
                          backgroundColor: 'var(--ved-surface)', 
                          textAlign: 'center',
                          color: 'var(--ved-text-secondary)'
                        }}>
                          Image failed to load
                        </div>
                      </div>
                      
                      <div className="ved-status-badge ved-status-missing">
                        Missing Alt Text
                      </div>
                      
                      <div style={{ padding: '12px 0' }}>
                        <p style={{ fontSize: '12px', color: 'var(--ved-text-secondary)', margin: '4px 0' }}>
                          Post ID: {image.postId}
                        </p>
                        
                        <div className="ved-action-buttons">
                          <button 
                            ref={el => buttonRefs.current[index] = el}
                            onClick={() => generateAltText(image, index)}
                            disabled={generatingFor === index}
                            className="ved-button ved-button-small"
                            aria-label={`Generate alt text for image from post ${image.postId}`}
                          >
                            {generatingFor === index && <div className="ved-spinner" aria-hidden="true"></div>}
                            {generatingFor === index ? 'Generating...' : 'Generate Alt Text'}
                          </button>
                        </div>
                        
                        {image.generatedAltText && (
                          <div style={{
                            marginTop: '12px',
                            padding: '12px',
                            backgroundColor: 'var(--ved-surface)',
                            borderRadius: '8px',
                            border: '1px solid var(--ved-border)'
                          }}>
                            <div className="ved-status-badge ved-status-generated" style={{ marginBottom: '8px' }}>
                              Generated Alt Text
                            </div>
                            <p style={{ margin: '0', fontStyle: 'italic', color: 'var(--ved-text)' }}>
                              "{image.generatedAltText}"
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="ved-success">
                <p><strong>🎉 Great news!</strong> All your images already have alt text!</p>
              </div>
            )}

            <div style={{ marginTop: '24px' }}>
              <button 
                onClick={() => setScanResults(null)}
                className="ved-button"
              >
                Scan Again
              </button>
            </div>
          </div>
        )}

        {reviewPopup && (
          <ReviewPopup
            image={reviewPopup.image}
            onUpdateAltText={(newAltText) => handleUpdateAltText(reviewPopup.index, newAltText)}
            onApprove={() => handleApprove(reviewPopup.image)}
            onReject={() => handleReject(reviewPopup.image)}
            onClose={() => setReviewPopup(null)}
            position={reviewPopup.position}
          />
        )}

        {flashMessage && (
          <FlashMessage
            message={flashMessage.text}
            type={flashMessage.type}
            onClose={() => setFlashMessage(null)}
          />
        )}
      </div>
    </div>
  )
}

export default Dashboard
