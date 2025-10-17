import ReviewCard from './ReviewCard'

function ImageList({ images, onUpdateAltText, onApprove, onReject }) {
  if (!images || images.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
        No images to review
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {images.map((image, index) => (
        <ReviewCard
          key={image.postId || index}
          image={image}
          onUpdateAltText={(newAltText) => onUpdateAltText(index, newAltText)}
          onApprove={() => onApprove(image)}
          onReject={() => onReject(image)}
        />
      ))}
    </div>
  )
}

export default ImageList
