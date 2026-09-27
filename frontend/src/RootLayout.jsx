import { Outlet } from 'react-router-dom'
import Navbar from './components/Layout/Navbar.jsx'
import ErrorBoundary from './components/Common/ErrorBoundary.jsx'

export default function RootLayout() {
  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      <Navbar />
      <main className="flex-1">
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>
    </div>
  )
}
