import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Activities from './pages/Activities'
import PadelBooking from './pages/PadelBooking'
import ComingSoon from './pages/ComingSoon'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/activities" element={<Activities />} />
        <Route path="/activities/padel" element={<PadelBooking />} />
        <Route path="/activities/zumba" element={<ComingSoon />} />
        <Route path="/activities/pilates" element={<ComingSoon />} />
        <Route path="/activities/yoga" element={<ComingSoon />} />
        <Route path="/activities/spinning" element={<ComingSoon />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App