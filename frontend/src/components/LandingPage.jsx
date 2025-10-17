import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import ImageModal from './ImageModal'

export default function LandingPage() {
  const navigate = useNavigate()
  const [modalImage, setModalImage] = useState(null)

  const handleGetStarted = () => {
    navigate('/connect')
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--ved-bg)' }}>
      {/* Main Content */}
      <div className="ved-container">
        {/* Hero Section */}
        <div className="ved-card" style={{ textAlign: 'center', marginTop: '40px' }}>
          <h1 style={{ fontSize: '48px', fontWeight: '700', color: 'var(--ved-text)', marginBottom: '24px' }}>
            AI-Powered Alt Text Generation
          </h1>
          <p style={{ fontSize: '20px', color: 'var(--ved-text-secondary)', marginBottom: '32px', maxWidth: '800px', margin: '0 auto 32px' }}>
            Generate accessible image descriptions for your ActivityPub and Pixelfed posts. 
            All processing happens in your browser - your data stays private and secure.
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '16px' }}>
            <button onClick={handleGetStarted} className="ved-button">
              Get Started For Free
            </button>
          </div>
          <p style={{ color: 'var(--ved-text-secondary)', fontSize: '14px' }}>
            Connect your ActivityPub or Pixelfed account to start generating accessible content
          </p>
        </div>

        {/* Privacy Section */}
        <div className="ved-card">
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <h2 style={{ fontSize: '32px', fontWeight: '700', color: 'var(--ved-text)', marginBottom: '16px' }}>
              Privacy-First Design
            </h2>
            <p style={{ fontSize: '18px', color: 'var(--ved-text-secondary)', maxWidth: '600px', margin: '0 auto' }}>
              Your privacy is our priority. All data processing happens securely with minimal data sharing.
            </p>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ 
                background: 'var(--ved-success)', 
                borderRadius: '50%', 
                width: '64px', 
                height: '64px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                margin: '0 auto 16px',
                color: 'white'
              }}>
                <svg width="32" height="32" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 style={{ fontSize: '20px', fontWeight: '600', color: 'var(--ved-text)', marginBottom: '8px' }}>
                Browser-Only Processing
              </h3>
              <p style={{ color: 'var(--ved-text-secondary)' }}>
                All your account data and tokens stay in your browser. We never store your credentials.
              </p>
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <div style={{ 
                background: 'var(--ved-primary)', 
                borderRadius: '50%', 
                width: '64px', 
                height: '64px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                margin: '0 auto 16px',
                color: 'white'
              }}>
                <svg width="32" height="32" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 style={{ fontSize: '20px', fontWeight: '600', color: 'var(--ved-text)', marginBottom: '8px' }}>
                Temporary Image Processing
              </h3>
              <p style={{ color: 'var(--ved-text-secondary)' }}>
                Images are sent temporarily to Amazon Bedrock for AI caption generation, then immediately discarded.
              </p>
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <div style={{ 
                background: 'var(--ved-warning)', 
                borderRadius: '50%', 
                width: '64px', 
                height: '64px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                margin: '0 auto 16px',
                color: 'white'
              }}>
                <svg width="32" height="32" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 style={{ fontSize: '20px', fontWeight: '600', color: 'var(--ved-text)', marginBottom: '8px' }}>
                No Data Storage
              </h3>
              <p style={{ color: 'var(--ved-text-secondary)' }}>
                We don't store your posts, images, or personal information. Everything stays with you.
              </p>
            </div>
          </div>
        </div>

        {/* Examples Section */}
        <div className="ved-card">
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <h2 style={{ fontSize: '32px', fontWeight: '700', color: 'var(--ved-text)', marginBottom: '16px' }}>
              See It in Action
            </h2>
            <p style={{ fontSize: '18px', color: 'var(--ved-text-secondary)', maxWidth: '600px', margin: '0 auto' }}>
              Our AI generates detailed, contextual descriptions for your images, making your content accessible to everyone.
            </p>
          </div>
          
          <div className="ved-image-grid">
            <div className="ved-post-card">
              <img 
                src="/Duck_StreetArt.jpg" 
                alt="Street art of a rubber duck on a white wall"
                style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '8px', marginBottom: '16px', cursor: 'pointer' }}
                onClick={() => setModalImage({ src: '/Duck_StreetArt.jpg', alt: 'Street art of a rubber duck on a white wall' })}
              />
              <h3 style={{ fontSize: '20px', fontWeight: '600', color: 'var(--ved-text)', marginBottom: '8px' }}>
                Rubber Duck Street Art
              </h3>
              <p style={{ color: 'var(--ved-text-secondary)', marginBottom: '12px' }}>
                "A close-up view of a white duck with a faded, brownish duck-like shape.  The wall has a textured surface with small bumps.  The duck’s head is turned to the right, and its body is slightly curved. The background is plain white. (AI-generated)"
              </p>
              <p style={{ color: 'var(--ved-success)', fontSize: '14px', fontWeight: '600' }}>
                ✓ Generated automatically by AI
              </p>
            </div>
            
            <div className="ved-post-card">
              <img 
                src="/Butterfly.jpg" 
                alt="Two butterflies on purple thistle flowers"
                style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '8px', marginBottom: '16px', cursor: 'pointer' }}
                onClick={() => setModalImage({ src: '/Butterfly.jpg', alt: 'Two butterflies on purple thistle flowers' })}
              />
              <h3 style={{ fontSize: '20px', fontWeight: '600', color: 'var(--ved-text)', marginBottom: '8px' }}>
                Butterflies in Nature
              </h3>
              <p style={{ color: 'var(--ved-text-secondary)', marginBottom: '12px' }}>
                "Two butterflies, one with brown and white wings and the other yellow and black wings, are perched on purple thistle flowers in a garden. The plants have spiky leaves and are surrounded by green foliage. The background is blurry with more greenery. (AI-generated)"
              </p>
              <p style={{ color: 'var(--ved-success)', fontSize: '14px', fontWeight: '600' }}>
                ✓ AI-generated with human review option
              </p>
            </div>

            <div className="ved-post-card">
              <img 
                src="/Lantern.jpg" 
                alt="Traditional paper lantern with warm lighting"
                style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '8px', marginBottom: '16px', cursor: 'pointer' }}
                onClick={() => setModalImage({ src: '/Lantern.jpg', alt: 'Traditional paper lantern with warm lighting' })}
              />
              <h3 style={{ fontSize: '20px', fontWeight: '600', color: 'var(--ved-text)', marginBottom: '8px' }}>
                Traditional Lantern
              </h3>
              <p style={{ color: 'var(--ved-text-secondary)', marginBottom: '12px' }}>
                "A red lantern with gold trim hangs from a decorative metal frame against a dark night sky.  In the background, the Empire State Building stands tall with its tower lit up in blue. The building's lights contrast with the warm glow of the lantern, creating a vibrant scene.  The sky is dark, and the city lights are softly illuminating the area. (AI-generated)
              </p>
              <p style={{ color: 'var(--ved-success)', fontSize: '14px', fontWeight: '600' }}>
                ✓ Context-aware descriptions
              </p>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="ved-card" style={{ background: 'var(--ved-surface)' }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <h2 style={{ fontSize: '32px', fontWeight: '700', color: 'var(--ved-text)', marginBottom: '16px' }}>
              Powerful Features
            </h2>
            <p style={{ fontSize: '18px', color: 'var(--ved-text-secondary)' }}>
              Everything you need to make your content accessible
            </p>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ 
                background: 'var(--ved-primary)', 
                borderRadius: '50%', 
                width: '48px', 
                height: '48px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                margin: '0 auto 16px',
                color: 'white'
              }}>
                <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--ved-text)', marginBottom: '8px' }}>
                AI-Powered Generation
              </h3>
              <p style={{ color: 'var(--ved-text-secondary)' }}>
                Advanced AI creates detailed, contextual descriptions
              </p>
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <div style={{ 
                background: 'var(--ved-success)', 
                borderRadius: '50%', 
                width: '48px', 
                height: '48px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                margin: '0 auto 16px',
                color: 'white'
              }}>
                <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--ved-text)', marginBottom: '8px' }}>
                Human Review
              </h3>
              <p style={{ color: 'var(--ved-text-secondary)' }}>
                Edit and approve AI-generated descriptions
              </p>
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <div style={{ 
                background: 'var(--ved-warning)', 
                borderRadius: '50%', 
                width: '48px', 
                height: '48px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                margin: '0 auto 16px',
                color: 'white'
              }}>
                <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--ved-text)', marginBottom: '8px' }}>
                ActivityPub Integration
              </h3>
              <p style={{ color: 'var(--ved-text-secondary)' }}>
                Works with Mastodon, Pixelfed, and more
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="ved-card" style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '32px', fontWeight: '700', color: 'var(--ved-text)', marginBottom: '16px' }}>
            Ready to Make Your Content Accessible?
          </h2>
          <p style={{ fontSize: '18px', color: 'var(--ved-text-secondary)', marginBottom: '24px', maxWidth: '500px', margin: '0 auto 24px' }}>
            Join the movement toward digital inclusion. Start generating accessible content today.
          </p>
          <button onClick={handleGetStarted} className="ved-button" style={{ fontSize: '18px', padding: '16px 32px' }}>
            Get Started For Free
          </button>
        </div>
      </div>

      {modalImage && (
        <ImageModal
          src={modalImage.src}
          alt={modalImage.alt}
          onClose={() => setModalImage(null)}
        />
      )}
    </div>
  )
}
