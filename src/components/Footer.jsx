import React from 'react'

export default function Footer() {
  return (
    <footer className="bg-light text-center py-3 mt-auto border-top">
      <div className="container">
        <small className="text-muted">© {new Date().getFullYear()} TravelEase</small>
      </div>
    </footer>
  )
}
