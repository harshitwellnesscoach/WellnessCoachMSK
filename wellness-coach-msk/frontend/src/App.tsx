import { useEffect, useState } from 'react'
import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom'
import { supabase } from './lib/supabase'
import type { Session } from '@supabase/supabase-js'

// Pages — create these files as you build each phase
import SignIn from './pages/SignIn'
import SignUp from './pages/SignUp'
import Dashboard from './pages/Dashboard'
import SessionPage from './pages/Session'
import ODI from './pages/ODI'
import Checkin from './pages/Checkin'
import Rescreen from './pages/Rescreen'
import RedFlag from './pages/Onboarding/RedFlag'
import Intake from './pages/Onboarding/Intake'
import BlockedScreen from './pages/Onboarding/BlockedScreen'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null | undefined>(undefined)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: listener } = supabase.auth.onAuthStateChange((_event, s) =>
      setSession(s),
    )
    return () => listener.subscription.unsubscribe()
  }, [])

  if (session === undefined) {
    // Still loading — render nothing (or a spinner)
    return null
  }

  return session ? <>{children}</> : <Navigate to="/signin" replace />
}

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Public */}
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/blocked" element={<BlockedScreen />} />

        {/* Onboarding */}
        <Route
          path="/onboarding/red-flag"
          element={
            <ProtectedRoute>
              <RedFlag />
            </ProtectedRoute>
          }
        />
        <Route
          path="/onboarding/intake"
          element={
            <ProtectedRoute>
              <Intake />
            </ProtectedRoute>
          }
        />

        {/* App */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/session"
          element={
            <ProtectedRoute>
              <SessionPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/odi"
          element={
            <ProtectedRoute>
              <ODI />
            </ProtectedRoute>
          }
        />
        <Route
          path="/checkin"
          element={
            <ProtectedRoute>
              <Checkin />
            </ProtectedRoute>
          }
        />
        <Route
          path="/rescreen"
          element={
            <ProtectedRoute>
              <Rescreen />
            </ProtectedRoute>
          }
        />

        {/* Default */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  )
}