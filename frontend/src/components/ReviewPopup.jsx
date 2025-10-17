import { useState, useEffect, useRef } from 'react'

function ReviewPopup({ image, onUpdateAltText, onApprove, onReject, onClose, position }) {
  const [altText, setAltText] = useState(image.generatedAltText || '')
  const [isEditing, setIsEditing] = useState(false)
  const popupRef = useRef(null)

  useEffect(() => {
    setAltText(image.generatedAltText || '')
  }, [image.generatedAltText])

  const handleSave = () => {
    onUpdateAltText(altText)
    setIsEditing(false)
  }

  const handleApprove = () => {
    if (altText.trim()) {
      onApprove()
      onClose()
    }
  }

  const handleReject = () => {
    onReject()
    onClose()
  }

  return (
    <div
      ref={popupRef}
      className="ved-card"
      style={{
        position: 'absolute',
        top: position.top,
        left: position.left,
        width: '350px',
        border: '2px solid var(--ved-primary)',
        zIndex: 1000,
        boxShadow: '0 8px 24px rgba(99, 100, 255, 0.2)'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: 'var(--ved-text)' }}>
          Review Alt Text
        </h4>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '20px',
            cursor: 'pointer',
            color: 'var(--ved-text-secondary)',
            padding: '4px',
            borderRadius: '4px'
          }}
        >
          ×
        </button>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <label className="ved-label" style={{ fontSize: '14px' }}>
          Generated Alt Text:
        </label>
        {isEditing ? (
          <textarea
            value={altText}
            onChange={(e) => setAltText(e.target.value)}
            className="ved-input"
            style={{
              minHeight: '80px',
              resize: 'vertical',
              fontSize: '14px'
            }}
            placeholder="Enter alt text for this image..."
          />
        ) : (
          <div style={{
            padding: '12px',
            border: '1px solid var(--ved-border)',
            borderRadius: '8px',
            backgroundColor: 'var(--ved-surface)',
            minHeight: '60px',
            fontSize: '14px',
            color: 'var(--ved-text)'
          }}>
            {altText || <em style={{ color: 'var(--ved-text-secondary)' }}>No alt text yet</em>}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {isEditing ? (
          <>
            <button
              onClick={handleSave}
              className="ved-button ved-button-small"
              style={{ backgroundColor: 'var(--ved-success)' }}
            >
              Save
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className="ved-button ved-button-secondary ved-button-small"
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setIsEditing(true)}
              className="ved-button ved-button-small"
            >
              Edit
            </button>
            <button
              onClick={handleApprove}
              disabled={!altText.trim()}
              className="ved-button ved-button-small"
              style={{ 
                backgroundColor: altText.trim() ? 'var(--ved-success)' : 'var(--ved-border)',
                cursor: altText.trim() ? 'pointer' : 'not-allowed'
              }}
            >
              Approve
            </button>
            <button
              onClick={handleReject}
              className="ved-button ved-button-small"
              style={{ backgroundColor: 'var(--ved-error)' }}
            >
              Ignore
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default ReviewPopup
