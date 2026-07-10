import React from 'react'

export default function Footer() {
  return (
    <footer
      className="bg-white border-top py-3"
      style={{
        borderTopColor: '#e5e7eb',
        boxShadow: '0 -1px 3px rgba(0,0,0,0.05)',
        marginTop: 'auto'
      }}
    >
      <div className="container-fluid px-4">
        <div className="row align-items-center justify-content-between g-3">
          <div className="col-auto">
            <small className="text-muted fw-500" style={{ fontSize: '0.875rem' }}>
              © {new Date().getFullYear()} TravelEase. All rights reserved.
            </small>
          </div>

          <div className="col-auto d-flex align-items-center gap-2">
            <span
              className="rounded-circle flex-shrink-0"
              style={{
                width: '10px',
                height: '10px',
                backgroundColor: 'var(--te-status-success)',
                display: 'inline-block'
              }}
            ></span>

            <small
              className="fw-600 text-muted"
              style={{ fontSize: '0.875rem' }}
            >
              OPERATIONAL
            </small>
          </div>
        </div>
      </div>
    </footer>
  )
}