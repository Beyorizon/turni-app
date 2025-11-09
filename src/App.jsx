// App.jsx — Layout principale con Navbar e rotte
import React, { useEffect } from 'react'
import { supabase } from './lib/supabaseClient'
import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import DayPage from './pages/DayPage'
// import Navbar from './components/Navbar'
import BottomNavbar from './components/BottomNavbar'

function App() {
  useEffect(() => {
    if (!supabase) {
      console.error('⚠️ Supabase client non inizializzato. Controlla .env.local')
      return
    }
    const testConnection = async () => {
      try {
        const { data, error } = await supabase.from('workers').select('*')
        if (error) throw error
        console.log('✅ Supabase connected:', data?.length ?? 0, 'records')
      } catch (err) {
        console.error('❌ Connection failed:', err.message)
      }
    }
    testConnection()
  }, [])
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-slate-200 text-gray-800 pb-20">
      {/* <Navbar /> rimosso */}
      <main className="max-w-6xl mx-auto px-4 md:px-12 pt-8 pb-24">
        <Routes>
          {/* Home → griglia dei giorni */}
          <Route path="/" element={<Home />} />
          {/* Giorno → DayPage con parametro 'giorno' */}
          <Route path="/giorno/:giorno" element={<DayPage />} />
        </Routes>
      </main>
      <BottomNavbar />
    </div>
  )
}
export default App
