function Help() {
  return (
    <div className="ved-container">
      <div className="ved-card">
        <h1>Help & Setup Guide</h1>
        
        <section style={{ marginBottom: '32px' }}>
          <h2>Getting Started</h2>
          <p>
            To use Vedfolnir, you'll need to create an access token from your Mastodon or 
            Pixelfed server. This token allows the application to read your posts and update 
            them with alt text descriptions.
          </p>
        </section>

        <section style={{ marginBottom: '32px' }}>
          <h2>Creating a Mastodon Access Token</h2>
          <div className="ved-card" style={{ background: 'var(--ved-surface)', marginBottom: '16px' }}>
            <h3>Step-by-Step Instructions:</h3>
            <ol>
              <li>Log in to your Mastodon instance (e.g., mastodon.social, masto.ai)</li>
              <li>Go to <strong>Preferences</strong> → <strong>Development</strong></li>
              <li>Click <strong>"New Application"</strong></li>
              <li>Fill in the application details:
                <ul>
                  <li><strong>Application name:</strong> Vedfolnir Alt Text Generator</li>
                  <li><strong>Application website:</strong> https://q.zero.vedfolnir.org</li>
                  <li><strong>Redirect URI:</strong> Leave as default (urn:ietf:wg:oauth:2.0:oob)</li>
                </ul>
              </li>
              <li>Set the required scopes:
                <ul>
                  <li>✅ <strong>read</strong> - Read your account's information</li>
                  <li>✅ <strong>write</strong> - Modify your account's information</li>
                </ul>
              </li>
              <li>Click <strong>"Submit"</strong></li>
              <li>Copy the <strong>"Your access token"</strong> (long string of characters)</li>
              <li>Paste this token into Vedfolnir's connection form</li>
            </ol>
          </div>
          
          <div className="ved-card" style={{ background: 'rgba(0, 186, 124, 0.1)', border: '1px solid rgba(0, 186, 124, 0.2)' }}>
            <p><strong>💡 Quick Access:</strong> Most Mastodon instances have the development page at:</p>
            <code>https://[your-instance]/settings/applications</code>
            <p style={{ marginTop: '8px', fontSize: '14px', color: 'var(--ved-text-secondary)' }}>
              Replace [your-instance] with your server (e.g., mastodon.social, masto.ai)
            </p>
          </div>
        </section>

        <section style={{ marginBottom: '32px' }}>
          <h2>Creating a Pixelfed Access Token</h2>
          <div className="ved-card" style={{ background: 'var(--ved-surface)', marginBottom: '16px' }}>
            <h3>Step-by-Step Instructions:</h3>
            <ol>
              <li>Log in to your Pixelfed instance (e.g., pixelfed.social, pixey.org)</li>
              <li>Go to <strong>Settings</strong> → <strong>Applications</strong> or <strong>API</strong></li>
              <li>Click <strong>"Create New Token"</strong> or <strong>"New Application"</strong></li>
              <li>Fill in the application details:
                <ul>
                  <li><strong>Name:</strong> Vedfolnir Alt Text Generator</li>
                  <li><strong>Website:</strong> https://q.zero.vedfolnir.org</li>
                </ul>
              </li>
              <li>Select the required permissions:
                <ul>
                  <li>✅ <strong>Read</strong> - View your posts and profile</li>
                  <li>✅ <strong>Write</strong> - Edit your posts</li>
                </ul>
              </li>
              <li>Click <strong>"Create"</strong> or <strong>"Generate Token"</strong></li>
              <li>Copy the generated access token</li>
              <li>Paste this token into Vedfolnir's connection form</li>
            </ol>
          </div>
          
          <div className="ved-card" style={{ background: 'rgba(255, 173, 31, 0.1)', border: '1px solid rgba(255, 173, 31, 0.2)' }}>
            <p><strong>⚠️ Note:</strong> Pixelfed instances may have slightly different interfaces. Look for:</p>
            <ul style={{ marginBottom: '0' }}>
              <li>"Applications", "API", or "Developer" in Settings</li>
              <li>"Personal Access Tokens" or "OAuth Applications"</li>
              <li>"Create Token" or "New Application" buttons</li>
            </ul>
          </div>
        </section>

        <section style={{ marginBottom: '32px' }}>
          <h2>Security & Privacy</h2>
          <div className="ved-card" style={{ background: 'rgba(99, 100, 255, 0.1)', border: '1px solid rgba(99, 100, 255, 0.2)' }}>
            <h3>🔒 Your Token is Safe</h3>
            <ul>
              <li><strong>Stored Locally:</strong> Tokens are encrypted and stored only in your browser</li>
              <li><strong>Never Transmitted:</strong> We never send your token to our servers</li>
              <li><strong>Revocable:</strong> You can revoke the token anytime from your server settings</li>
              <li><strong>Limited Scope:</strong> Token only has read/write permissions you granted</li>
            </ul>
          </div>
        </section>

        <section style={{ marginBottom: '32px' }}>
          <h2>Troubleshooting</h2>
          
          <h3>Common Issues:</h3>
          
          <div style={{ marginBottom: '16px' }}>
            <h4>❌ "Invalid token" or "Authentication failed"</h4>
            <ul>
              <li>Double-check you copied the entire token (no extra spaces)</li>
              <li>Ensure the token has both 'read' and 'write' permissions</li>
              <li>Verify your instance URL is correct (e.g., https://masto.ai)</li>
            </ul>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <h4>❌ "No posts found" or "No images found"</h4>
            <ul>
              <li>Make sure you have recent posts with images</li>
              <li>Check that your posts are public or unlisted (not private)</li>
              <li>Some instances may have API rate limits</li>
            </ul>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <h4>❌ Can't find the Applications/API settings</h4>
            <ul>
              <li>Try: Settings → Development, Settings → Applications, or Settings → API</li>
              <li>Some instances may call it "OAuth Applications" or "Personal Access Tokens"</li>
              <li>Contact your instance administrator if the option is missing</li>
            </ul>
          </div>
        </section>

        <section>
          <h2>Need More Help?</h2>
          <p>
            If you're still having trouble, use an AI tool to help yourself, for technical issues file a github issue at:
          </p>
          <ul>
            <li><strong>Project Git:</strong> <a href="https://github.com/iolaire/Vedfolnir-serverless-MVP-Q" target="_blank" rel="noopener noreferrer">Vedfolnir-serverless-MVP-Q</a></li>
          </ul>
        </section>
      </div>
    </div>
  )
}

export default Help
