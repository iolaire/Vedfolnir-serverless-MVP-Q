// Post scanning utilities for extracting images from Mastodon posts

import { fetchPosts } from './activityPubClient'

// Simple platform detection - defaults to mastodon for safety
export async function detectPlatform(instanceUrl, token) {
  try {
    console.log('Attempting platform detection for:', instanceUrl)
    const response = await fetch(`${instanceUrl}/api/v1/instance`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    
    console.log('Instance API response status:', response.status)
    
    if (!response.ok) {
      console.log('Instance API failed, trying without auth...')
      // Try without auth - some instances allow public access
      const publicResponse = await fetch(`${instanceUrl}/api/v1/instance`)
      if (publicResponse.ok) {
        const instance = await publicResponse.json()
        console.log('Public instance info:', instance)
        
        if (instance.version?.toLowerCase().includes('pixelfed')) {
          return 'pixelfed'
        }
      }
      throw new Error(`Instance API returned ${response.status}`)
    }
    
    const instance = await response.json()
    
    // Log for testing different platforms
    console.log('Instance info:', {
      url: instanceUrl,
      version: instance.version,
      software: instance.software,
      title: instance.title
    })
    
    // Check for pixelfed indicators (case insensitive)
    if (instance.version?.toLowerCase().includes('pixelfed')) {
      return 'pixelfed'
    }
    
    // Default to mastodon (safe fallback)
    return 'mastodon'
  } catch (error) {
    console.log('Platform detection failed, defaulting to mastodon:', error)
    return 'mastodon'
  }
}

export async function fetchUserPosts(instanceUrl, token) {
  try {
    return await fetchPosts(instanceUrl, token)
  } catch (error) {
    return []
  }
}

// Platform-specific scanning functions
export async function scanMastodonPosts(instanceUrl, token) {
  try {
    return await fetchPosts(instanceUrl, token)
  } catch (error) {
    return []
  }
}

export async function scanPixelfedPosts(instanceUrl, token) {
  try {
    // Pixelfed uses same API endpoints but may have different response structure
    const posts = await fetchPosts(instanceUrl, token)
    
    // Log Pixelfed-specific structure for analysis
    if (posts.length > 0) {
      console.log('Pixelfed post structure:', {
        sample: posts[0],
        mediaAttachments: posts[0]?.media_attachments?.[0]
      })
    }
    
    return posts
  } catch (error) {
    console.log('Pixelfed scanning failed, trying Mastodon compatibility:', error)
    return []
  }
}

// Unified interface - routes to appropriate platform handler
export async function scanPostsByPlatform(platform, instanceUrl, token) {
  if (platform === 'pixelfed') {
    return await scanPixelfedPosts(instanceUrl, token)
  }
  return await scanMastodonPosts(instanceUrl, token)
}

export function extractImagesFromPosts(posts) {
  const images = []
  
  for (const post of posts) {
    if (post.media_attachments && post.media_attachments.length > 0) {
      for (const attachment of post.media_attachments) {
        if (attachment.type === 'image') {
          images.push({
            postId: post.id,
            mediaId: attachment.id,
            url: attachment.url,
            description: attachment.description
          })
        }
      }
    }
  }
  
  return images
}

export function filterPostsWithoutAltText(images) {
  return images.filter(image => {
    const description = image.description
    return !description || description.trim() === ''
  })
}
