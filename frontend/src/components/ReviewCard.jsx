import { useState } from 'react'

function ReviewCard({ image, onUpdateAltText, onApprove, onReject }) {
  const [altText, setAltText] = useState(image.generatedAltText || '')
  const [isEditing, setIsEditing] = useState(false)

  const handleSave = () => {
    onUpdateAltText(altText)
    setIsEditing(false)
  }

  const handleApprove = () => {
    if (altText.trim()) {
      onApprove()
    }
  }

  return (
    <div style={{
      border: '1px solid #ddd',
      borderRadius: '8px',
      padding: '20px',
      backgroundColor: '#fff'
    }}>
      <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
        <div style={{ flex: '0 0 200px' }}>
          <img
            src={image.url}
            alt="Image to review"
            style={{
              width: '100%',
              height: 'auto',
              borderRadius: '4px',
              border: '1px solid #eee'
            }}
          />
        </div>
        
        <div style={{ flex: 1 }}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Alt Text:
            </label>
            {isEditing ? (
              <textarea
                value={altText}
                onChange={(e) => setAltText(e.target.value)}
                style={{
                  width: '100%',
                  minHeight: '80px',
                  padding: '8px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
                placeholder="Enter alt text for this image..."
              />
            ) : (
              <div style={{
                padding: '8px',
                border: '1px solid #eee',
                borderRadius: '4px',
                backgroundColor: '#f9f9f9',
                minHeight: '60px'
              }}>
                {altText || <em style={{ color: '#666' }}>No alt text yet</em>}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {isEditing ? (
              <>
                <button
                  onClick={handleSave}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Save
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Edit
                </button>
                <button
                  onClick={handleApprove}
                  disabled={!altText.trim()}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: altText.trim() ? '#28a745' : '#ccc',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: altText.trim() ? 'pointer' : 'not-allowed'
                  }}
                >
                  Approve
                </button>
                <button
                  onClick={onReject}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Reject
                </button>
              </>
            )}
          </div>

          <div style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
            Post ID: {image.postId}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ReviewCard
