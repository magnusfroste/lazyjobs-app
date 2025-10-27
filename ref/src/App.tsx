import { useState, useEffect } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './lib/supabase'
import { initializeConfig } from './lib/config'
import Auth from './components/Auth'
import SwipeInterface from './components/SwipeInterface'
import InstallPrompt from './components/InstallPrompt'
import ErrorBoundary from './components/ErrorBoundary'
import { ThemeProvider } from './contexts/ThemeContext'

function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    // Initialize app
    async function init() {
      // Fetch config from Supabase (feature flags, settings)
      // Don't await - let it run in parallel, don't block session
      initializeConfig().catch(err => {
        console.warn('Config fetch failed, using defaults:', err)
      })

      // Get initial session (PRIORITY - don't wait for config!)
      const {
        data: { session },
      } = await supabase.auth.getSession()
      setSession(session)
      setLoading(false)
    }

    init()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600"></div>
      </div>
    )
  }

  return (
    <ThemeProvider>
      <ErrorBoundary>
        {!session ? <Auth /> : <SwipeInterface user={session.user} />}
        <InstallPrompt />
      </ErrorBoundary>
    </ThemeProvider>
  )
}

export default App
