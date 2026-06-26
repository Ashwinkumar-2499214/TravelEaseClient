import React from 'react'

export default function Footer() {
  return (
    <footer className="bg-dark border-top border-secondary py-3 mt-auto">
      <div className="container">
        <div className="d-flex justify-content-between align-items-center">
          <small className="text-light font-monospace">
            © {new Date().getFullYear()} TravelEase Systems
          </small>
          <div className="d-flex align-items-center">
            <div className="spinner-grow spinner-grow-sm text-info me-2" role="status"></div>
            <small className="text-light font-monospace">ONLINE</small>
          </div>
        </div>
      </div>
    </footer>
  )
}
