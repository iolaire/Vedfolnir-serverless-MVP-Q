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

// ActivityPub client for Mastodon API integration

export async function validateToken(instanceUrl, token) {
  try {
    const response = await fetch(`${instanceUrl}/api/v1/accounts/verify_credentials`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
    
    return response.ok
  } catch (error) {
    return false
  }
}

export async function testConnection(instanceUrl) {
  try {
    const response = await fetch(`${instanceUrl}/api/v1/instance`)
    return response.ok
  } catch (error) {
    return false
  }
}

export async function fetchPosts(instanceUrl, token) {
  try {
    console.log('Attempting to fetch posts from:', instanceUrl)
    
    // First verify credentials to get user info
    const response = await fetch(`${instanceUrl}/api/v1/accounts/verify_credentials`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
    
    console.log('Verify credentials response status:', response.status)
    
    if (!response.ok) {
      console.log('Verify credentials failed, trying alternative approach...')
      // Try to get home timeline directly without user verification
      const timelineResponse = await fetch(`${instanceUrl}/api/v1/timelines/home?limit=40`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      console.log('Timeline response status:', timelineResponse.status)
      
      if (timelineResponse.ok) {
        const posts = await timelineResponse.json()
        console.log('Successfully fetched posts via timeline:', posts.length)
        return posts
      }
      
      throw new Error(`Authentication failed: ${response.status}`)
    }
    
    const user = await response.json()
    console.log('User verified:', user.username)
    
    // Fetch user's statuses (posts)
    const postsResponse = await fetch(`${instanceUrl}/api/v1/accounts/${user.id}/statuses?limit=20`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
    
    console.log('Posts response status:', postsResponse.status)
    
    if (!postsResponse.ok) {
      return []
    }
    
    const posts = await postsResponse.json()
    console.log('Successfully fetched user posts:', posts.length)
    return posts
  } catch (error) {
    console.log('fetchPosts error:', error)
    return []
  }
}
