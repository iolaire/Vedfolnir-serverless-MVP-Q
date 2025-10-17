import { useEffect, useRef } from 'react'

function ImageModal({ src, alt, onClose }) {
  const modalRef = useRef(null)
  const closeButtonRef = useRef(null)

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose()
    }

    // Focus trap
    const handleTab = (e) => {
      if (e.key === 'Tab') {
        e.preventDefault()
        closeButtonRef.current?.focus()
      }
    }

    document.addEventListener('keydown', handleEscape)
    document.addEventListener('keydown', handleTab)
    
    // Focus the close button when modal opens
    closeButtonRef.current?.focus()
    
    // Prevent body scroll
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.removeEventListener('keydown', handleTab)
      document.body.style.overflow = 'unset'
    }
  }, [onClose])

  if (!src) return null

  return (
    <div 
      className="ved-modal-overlay" 
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      ref={modalRef}
    >
      <div className="ved-modal-content" onClick={(e) => e.stopPropagation()}>
        <button 
          ref={closeButtonRef}
          className="ved-modal-close" 
          onClick={onClose}
          aria-label="Close image modal"
        >
          ×
        </button>
        <img 
          src={src} 
          alt={alt} 
          className="ved-modal-image"
          id="modal-title"
        />
      </div>
    </div>
  )
}

export default ImageModal
