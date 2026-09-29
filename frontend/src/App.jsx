import { createBrowserRouter } from 'react-router-dom'
import RootLayout from './RootLayout.jsx'
import HomePage from './pages/HomePage.jsx'
import WatershedAnalysis from './pages/WatershedAnalysis.jsx'
import ThematicMaps from './pages/ThematicMaps.jsx'
import ImageGalleryPage from './pages/ImageGallery.jsx'
import Reports from './pages/Reports.jsx'
import DrishtiSync from './pages/DrishtiSync.jsx'

const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'watershed/:id', element: <WatershedAnalysis /> },
      { path: 'thematic-maps', element: <ThematicMaps /> },
      { path: 'gallery', element: <ImageGalleryPage /> },
      { path: 'drishti-sync', element: <DrishtiSync /> },
      { path: 'reports', element: <Reports /> },
    ],
  },
])

export default router
