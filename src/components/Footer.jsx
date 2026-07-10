import React from 'react'

export default function Footer() {
  return (
    <footer
      className="fixed-bottom bg-white border-top shadow-sm py-3"
      style={{
        borderColor: '#6f42c1'
      }}
    >
      <div className="container">
        <div className="d-flex justify-content-between align-items-center">

          <small className="text-muted">
            © {new Date().getFullYear()} TravelEase
          </small>

          <div className="d-flex align-items-center">
            <span
              className="rounded-circle me-2"
              style={{
                width: '10px',
                height: '10px',
                backgroundColor: '#6f42c1',
                display: 'inline-block'
              }}
            ></span>

            <small
              className="fw-semibold"
              style={{ color: '#6f42c1' }}
            >
              ONLINE
            </small>
          </div>

        </div>
      </div>
    </footer>
  )
}