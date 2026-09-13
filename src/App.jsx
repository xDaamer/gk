import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import ArchivePage from './pages/ArchivePage'
import DashboardPage from './pages/DashboardPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/arsiv" element={<ArchivePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
