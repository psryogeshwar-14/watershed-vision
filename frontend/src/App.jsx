import { createBrowserRouter } from 'react-router-dom'
import Layout from './components/Layout/Navbar.jsx'
import RootLayout from './RootLayout.jsx'
import HomePage from './pages/HomePage.jsx'
import WatershedAnalysis from './pages/WatershedAnalysis.jsx'
import ThematicMaps from './pages/ThematicMaps.jsx'
import ImageGalleryPage from './pages/ImageGallery.jsx'
import Reports from './pages/Reports.jsx'

const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'watershed/:id', element: <WatershedAnalysis /> },
      { path: 'thematic-maps', element: <ThematicMaps /> },
      { path: 'gallery', element: <ImageGalleryPage /> },
      { path: 'reports', element: <Reports /> },
    ],
  },
])

export default router
