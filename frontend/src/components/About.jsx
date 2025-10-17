function About() {
  return (
    <div className="ved-container">
      <div className="ved-card">
        <h1>About Vedfolnir</h1>
        
        <section style={{ marginBottom: '32px' }}>
          <h2>AI-Powered Accessibility for the Fediverse</h2>
          <p>
            Vedfolnir is an accessibility-focused application that automatically generates 
            descriptive alt text for images in your ActivityPub and Pixelfed posts. Using 
            Amazon Bedrock's advanced AI models, we help make the Fediverse more inclusive 
            and accessible to everyone.
          </p>
        </section>

        <section style={{ marginBottom: '32px' }}>
          <h2>Privacy-First Design</h2>
          <p>
            Your privacy is our top priority. Vedfolnir is designed with privacy at its core:
          </p>
          <ul>
            <li><strong>Browser-Only Processing:</strong> Your account credentials and tokens stay in your browser and are never stored on our servers</li>
            <li><strong>Temporary Image Processing:</strong> Images are sent temporarily to Amazon Bedrock for AI analysis and immediately discarded</li>
            <li><strong>No Data Storage:</strong> We don't store your posts, images, or personal information</li>
            <li><strong>Encrypted Tokens:</strong> Access tokens are encrypted in your browser's local storage</li>
          </ul>
        </section>

        <section style={{ marginBottom: '32px' }}>
          <h2>How It Works</h2>
          <ol>
            <li>Connect your Mastodon or Pixelfed account using an access token</li>
            <li>Scan your recent posts for images without alt text</li>
            <li>Generate AI-powered descriptions using Amazon Bedrock Nova Lite</li>
            <li>Review and approve the generated alt text</li>
            <li>Update your posts with accessible descriptions</li>
          </ol>
        </section>

        <section style={{ marginBottom: '32px' }}>
          <h2>About the Creator</h2>
          <p>
          Vedfolnir was created by <strong>Iolaire McFadden</strong>, a retired data scientist and lifelong Macintosh
           computer tinkerer based in Arlington, VA, which is in the Washington DC Metro area. After 25 years
           working in the commercial real estate data world, I retired and am building things 
           that are photo and open web related. That’s what led me to create Vedfolnir,
           a project that brings together my interest in AI, web accessibility, and the Fediverse ecosystem.

           Travel is a big part of my life — my wife and I make it our main hobby. I’ve been deep in the 
           miles and points game for years, always looking for smart ways to explore more of the world. 
           I also support micro-lending through Kiva.org, which lets me help others do the same in their own way.

           I’ve always enjoyed point-and-shoot photography and lately have been graduating to newer and better iPhone 
           cameras. I love capturing architecture, natural scenes, and water — anything that catches the light in an interesting way.
           My current phone is an iPhone 17 Pro with a great zoom lens.

           A few years back, I spent three years on dialysis before receiving a kidney transplant. Even then, I kept traveling, 
           receiving treatments around the world that opened my eyes to the accessibility world. 
           These days, it’s a lot easier — and I’m grateful every trip I take.
          </p>
        </section>

        <section style={{ marginBottom: '32px' }}>
          <h2>Contact Information</h2>
          <div style={{ background: 'var(--ved-surface)', padding: '20px', borderRadius: '8px' }}>
            <p><strong>Creator:</strong> Iolaire McFadden</p>
            <p><strong>Pixelfed:</strong> <a href="https://pixey.org/@iolaire" target="_blank" rel="noopener noreferrer">@iolaire@pixey.org</a></p>
            <p><strong>Mastodon:</strong> <a href="https://masto.ai/@iolaire" target="_blank" rel="noopener noreferrer">@iolaire@masto.ai</a></p>
            <p><strong>Website:</strong> <a href="https://iolaire.net" target="_blank" rel="noopener noreferrer">iolaire.net</a></p>
            <p><strong>Development Website:</strong> <a href="https://iolaire.dev" target="_blank" rel="noopener noreferrer">iolaire.dev</a></p>
            <p><strong>Project Git:</strong> <a href="https://github.com/iolaire/Vedfolnir-serverless-MVP-Q" target="_blank" rel="noopener noreferrer">Vedfolnir-serverless-MVP-Q</a></p>
          </div>
        </section>

        <section>
          <h2>Open Source & Accessibility</h2>
          <p>
            Vedfolnir is built with accessibility in mind and follows WCAG 2.2 Level AA 
            guidelines. The application supports keyboard navigation, screen readers, and 
            responsive design to ensure it's usable by everyone.
          </p>
        </section>
      </div>
    </div>
  )
}

export default About
