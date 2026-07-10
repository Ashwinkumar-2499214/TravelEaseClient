import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './features/authentication/AuthProvider'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import Unauthorized from './pages/Unauthorized'
import Navbar from './components/Navbar'
import Sidebar from './components/Sidebar'
import Footer from './components/Footer'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="d-flex flex-column min-vh-100">
          <Navbar />

          <div className="d-flex flex-grow-1">
            <Sidebar />

            {/* Navbar is fixed-top; we offset content using Bootstrap padding instead of inline margin hacks */}
            <main className="flex-grow-1 w-100 te-bg-gray pt-5">
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/unauthorized" element={<Unauthorized />} />
                <Route path="/dashboard/*" element={<DashboardPage />} />
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </main>
          </div>

          <Footer />
        </div>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App

