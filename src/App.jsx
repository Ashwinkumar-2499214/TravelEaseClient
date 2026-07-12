import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './features/authentication/AuthProvider' // 1. Import useAuth
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import Unauthorized from './pages/Unauthorized'
import Navbar from './components/Navbar'
import Sidebar from './components/Sidebar'
import Footer from './components/Footer'
import ChatbotWidget from './components/ChatbotWidget' // 2. Import your chatbot component

// Create an inner wrapper so we can safely use the useAuth hook inside the Router context
function AppContent() {
  // 3. Destructure your auth state (adjust 'user' or 'isAuthenticated' to match your actual hook)
  const { user } = useAuth(); 

  return (
    <div className="d-flex flex-column min-vh-100">
      <Navbar />

      {/* 4. Only mount the chatbot when the user is logged in */}
      {user && <ChatbotWidget />}

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
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App