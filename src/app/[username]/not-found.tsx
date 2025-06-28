export default function NotFound() {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #232526 0%, #414345 100%)', color: '#fff' }}>
        <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>404</h1>
        <p style={{ fontSize: '1.5rem', marginBottom: '2rem' }}>
          Sorry, this profile does not exist.
        </p>
        <a href="/" style={{ color: '#4A90E2', textDecoration: 'underline', fontSize: '1.1rem' }}>Go back home</a>
      </div>
    )
  }