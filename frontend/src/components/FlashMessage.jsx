import { useEffect } from 'react'

function FlashMessage({ message, type = 'success', onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, 1000)

    return () => clearTimeout(timer)
  }, [onClose])

  if (!message) return null

  return (
    <div 
      className={`ved-flash-message ved-flash-${type}`}
      role="alert"
      aria-live="polite"
      aria-atomic="true"
    >
      <span>{message}</span>
      <button 
        onClick={onClose} 
        className="ved-flash-close"
        aria-label="Close notification"
      >
        ×
      </button>
    </div>
  )
}

export default FlashMessage
