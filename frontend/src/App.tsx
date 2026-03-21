import { Routes, Route, BrowserRouter } from 'react-router-dom'
import Register from './Pages/Register'
import Chat from './Pages/Chat'

import './App.css'

function App() {

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Register />} />
        <Route path="/chat" element={<Chat />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
