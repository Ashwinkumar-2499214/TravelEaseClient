import React from 'react'

export default function Footer() {
  return (
    <footer
      className="bg-white border-top py-3"
      style={{
        borderColor: '#e5e7eb',
        boxShadow: '0 -1px 3px rgba(0,0,0,0.05)',
        marginTop: 'auto'
      }}
    >
      <div className="container-fluid">
        <div className="row align-items-center justify-content-between">
          <div className="col-auto">
            <small className="text-muted fw-500">
              © {new Date().getFullYear()} TravelEase. All rights reserved.
            </small>
          </div>

          <div className="col-auto d-flex align-items-center gap-2">
            <span
              className="rounded-circle"
              style={{
                width: '10px',
                height: '10px',
                backgroundColor: '#10b981',
                display: 'inline-block'
              }}
            ></span>

            <small
              className="fw-600"
              style={{ color: '#6b7280' }}
            >
              OPERATIONAL
            </small>
          </div>
        </div>
      </div>
    </footer>
  )
}