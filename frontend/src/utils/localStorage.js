// localStorage utilities for token management

const TOKEN_KEY = 'mastodon_token'

export function saveToken(encryptedToken) {
  localStorage.setItem(TOKEN_KEY, encryptedToken)
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
}
