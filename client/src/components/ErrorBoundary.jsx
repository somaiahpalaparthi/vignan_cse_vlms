import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("LabFlow CMS Application Error caught by Boundary:", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    try {
      // Clear potentially corrupted local storage keys
      localStorage.removeItem('vlms_inventory');
      localStorage.removeItem('vlms_stock_list');
      localStorage.removeItem('vlms_issues');
    } catch (e) {}
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/dashboard';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#060911',
          color: '#f1f5f9',
          fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
          padding: '24px'
        }}>
          <div style={{
            maxWidth: '560px',
            width: '100%',
            padding: '36px',
            background: 'rgba(13, 19, 32, 0.95)',
            border: '1px solid rgba(0, 242, 254, 0.3)',
            borderRadius: '16px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
            textAlign: 'center'
          }}>
            <div style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              color: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.8rem',
              margin: '0 auto 20px auto'
            }}>
              ⚠️
            </div>

            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff', marginBottom: '10px' }}>
              Dashboard Render Recovery
            </h2>

            <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: '24px' }}>
              An unexpected display issue occurred while rendering the lab dashboard session.
            </p>

            {this.state.error?.message && (
              <div style={{
                padding: '12px 16px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '8px',
                color: '#fca5a5',
                fontSize: '0.82rem',
                fontFamily: 'monospace',
                textAlign: 'left',
                marginBottom: '24px',
                wordBreak: 'break-word'
              }}>
                {this.state.error.message}
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={() => window.location.reload()}
                style={{
                  padding: '12px 20px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontSize: '0.88rem'
                }}
              >
                Reload Page
              </button>

              <button
                onClick={this.handleReset}
                style={{
                  padding: '12px 24px',
                  background: '#00f2fe',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#060911',
                  fontWeight: 800,
                  cursor: 'pointer',
                  fontSize: '0.88rem',
                  boxShadow: '0 0 16px rgba(0, 242, 254, 0.3)'
                }}
              >
                Reset Session & Fix View
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
