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

function Legal() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--ved-bg)' }}>
      <div className="ved-container">
        <div className="ved-card" style={{ marginTop: '40px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: '700', color: 'var(--ved-text)', marginBottom: '8px' }}>
            Legal & Privacy
          </h1>
          <p style={{ color: 'var(--ved-text-secondary)', marginBottom: '32px' }}>
            Simple, transparent policies for our accessibility service
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <section>
              <h2 style={{ fontSize: '24px', fontWeight: '600', color: 'var(--ved-text)', marginBottom: '16px' }}>
                Privacy Policy (GDPR Compliant)
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', color: 'var(--ved-text)', lineHeight: '1.6' }}>
                <p><strong>Data We Collect:</strong> None. We don't store personal information.</p>
                <p><strong>Image Processing:</strong> Images are processed temporarily by Amazon Bedrock to generate alt-text, then immediately discarded.</p>
                <p><strong>No Tracking:</strong> We don't use cookies, analytics, or tracking.</p>
                <p><strong>No Accounts:</strong> Anonymous service - no registration required.</p>
                <p><strong>Your Rights:</strong> Since we don't store your data, there's nothing to delete or modify.</p>
              </div>
            </section>

            <section>
              <h2 style={{ fontSize: '24px', fontWeight: '600', color: 'var(--ved-text)', marginBottom: '16px' }}>
                Terms of Service
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', color: 'var(--ved-text)', lineHeight: '1.6' }}>
                <p><strong>Service:</strong> Free AI-powered alt-text generation for accessibility.</p>
                <p><strong>Usage:</strong> For legitimate accessibility purposes only.</p>
                <p><strong>No Warranty:</strong> Service provided "as is" without guarantees.</p>
                <p><strong>Availability:</strong> Service may be unavailable without notice.</p>
              </div>
            </section>

            <section>
              <h2 style={{ fontSize: '24px', fontWeight: '600', color: 'var(--ved-text)', marginBottom: '16px' }}>
                Technical Details
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', color: 'var(--ved-text)', lineHeight: '1.6' }}>
                <p><strong>Powered by:</strong> Amazon Bedrock Nova Lite AI model</p>
                <p><strong>Open Source:</strong> Available under AGPL v3+ license</p>
                <p><strong>Contact:</strong> Available via GitHub repository</p>
              </div>
            </section>
          </div>

          <div style={{ 
            marginTop: '32px', 
            paddingTop: '32px', 
            borderTop: '1px solid var(--ved-border)', 
            fontSize: '14px', 
            color: 'var(--ved-text-secondary)' 
          }}>
            <p>Last updated: October 16, 2025</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Legal
