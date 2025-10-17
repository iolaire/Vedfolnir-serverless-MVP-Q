// ActivityPub post update utilities
// Updated for Pixelfed media API fix

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))

// Platform-specific update functions
export async function updateMastodonAltText(instanceUrl, accessToken, postId, mediaId, altText) {
  console.log('Update request details:', { instanceUrl, postId, mediaId, altText: altText.substring(0, 50) + '...' })
  
  const maxAttempts = 2
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      // First, get the current post to preserve its content
      const getUrl = `${instanceUrl}/api/v1/statuses/${postId}`
      console.log(`Attempt ${attempt}: GET ${getUrl}`)
      
      const getResponse = await fetch(getUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })
      
      if (!getResponse.ok) {
        throw new Error(`Failed to get post: HTTP ${getResponse.status}`)
      }
      
      const currentPost = await getResponse.json()
      
      // Extract plain text from HTML content
      const tempDiv = document.createElement('div')
      tempDiv.innerHTML = currentPost.content
      const plainText = tempDiv.textContent || tempDiv.innerText || ''
      
      // Update the media attachment's description
      const updatedAttachments = currentPost.media_attachments.map(attachment => {
        if (attachment.id === mediaId) {
          return { ...attachment, description: altText }
        }
        return attachment
      })
      
      // Update the post with new media descriptions, preserving original text
      const putUrl = `${instanceUrl}/api/v1/statuses/${postId}`
      console.log(`Attempt ${attempt}: PUT ${putUrl}`)
      
      const response = await fetch(putUrl, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: plainText,
          media_ids: updatedAttachments.map(a => a.id),
          media_attributes: updatedAttachments.map(a => ({
            id: a.id,
            description: a.description
          }))
        })
      })

      if (response.status === 429) {
        const retryAfter = response.headers.get('retry-after')
        return {
          success: false,
          error: `Rate limited. Retry after ${retryAfter} seconds`
        }
      }

      if (!response.ok) {
        const errorText = await response.text()
        console.log(`HTTP ${response.status} response:`, errorText)
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      return { success: true, data }
      
    } catch (error) {
      if (attempt === maxAttempts) {
        return {
          success: false,
          error: `Failed after ${maxAttempts} attempts: ${error.message}`
        }
      }
      
      // Wait 1 second before retry
      await delay(1000)
    }
  }
}

export async function updateMultiplePosts(instanceUrl, accessToken, posts, progressCallback) {
  const results = []
  
  for (let i = 0; i < posts.length; i++) {
    if (progressCallback) {
      progressCallback(i, posts.length)
    }
    
    const post = posts[i]
    const result = await updatePostAltText(
      instanceUrl,
      accessToken,
      post.postId,
      post.mediaId,
      post.altText
    )
    
    results.push(result)
    
    // Rate limiting: 1 req/sec (wait 1s between requests, except for last)
    if (i < posts.length - 1) {
      await delay(1000)
    }
  }
  
  if (progressCallback) {
    progressCallback(posts.length, posts.length)
  }
  
  return results
}

export async function updatePixelfedCaption(instanceUrl, accessToken, postId, mediaId, altText) {
  console.log('Pixelfed update request:', { instanceUrl, postId, mediaId, altText: altText.substring(0, 50) + '...' })
  
  try {
    // Use Pixelfed's media API endpoint
    const mediaUrl = `${instanceUrl}/api/v1/media/${mediaId}`
    console.log(`Updating Pixelfed media: PUT ${mediaUrl}`)
    
    const response = await fetch(mediaUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        description: altText
      })
    })

    if (response.status === 429) {
      const retryAfter = response.headers.get('retry-after')
      return {
        success: false,
        error: `Rate limited. Retry after ${retryAfter} seconds`
      }
    }

    if (!response.ok) {
      const errorText = await response.text()
      console.log(`HTTP ${response.status} response:`, errorText)
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    return { success: true, data }
    
  } catch (error) {
    console.log('Pixelfed media update failed, trying Mastodon compatibility:', error)
    return await updateMastodonAltText(instanceUrl, accessToken, postId, mediaId, altText)
  }
}

// Unified interface - routes to appropriate platform handler
export async function updatePostByPlatform(platform, instanceUrl, accessToken, postId, mediaId, altText) {
  if (platform === 'pixelfed') {
    return await updatePixelfedCaption(instanceUrl, accessToken, postId, mediaId, altText)
  }
  return await updateMastodonAltText(instanceUrl, accessToken, postId, mediaId, altText)
}

// Backward compatibility wrapper - maintains existing API
export async function updatePostAltText(instanceUrl, accessToken, postId, mediaId, altText) {
  return await updateMastodonAltText(instanceUrl, accessToken, postId, mediaId, altText)
}
