import { useNavigate, Link, useLocation } from 'react-router-dom'
import { Home, ArrowLeft } from 'lucide-react'

export default function BottomNavbar() {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <nav className="
      fixed bottom-0 left-0 right-0 z-50
      bg-white/40 backdrop-blur-2xl border-t border-white/20
      shadow-[0_-4px_30px_rgba(0,0,0,0.05)]
      flex justify-around items-center h-16
    ">
      <button
        onClick={() => navigate(-1)}
        className="flex flex-col items-center text-gray-700 hover:scale-[1.1] transition-all"
      >
        <ArrowLeft className="w-5 h-5" />
        <span className="text-xs">Indietro</span>
      </button>

      <Link
        to="/"
        className={`flex flex-col items-center text-gray-700 hover:scale-[1.1] transition-all ${location.pathname === '/' ? 'font-semibold text-blue-600' : ''}`}
      >
        <Home className="w-5 h-5" />
        <span className="text-xs">Home</span>
      </Link>
    </nav>
  )
}