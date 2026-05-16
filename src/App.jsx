import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Home from './screens/Home'
import MagazineViewer from './screens/MagazineViewer'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/magazine" element={<MagazineViewer bgColor="#1a2bc3" />} />
      </Routes>
    </Router>
  )
}

export default App
