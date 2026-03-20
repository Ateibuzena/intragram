import { Routes, Route, BrowserRouter } from 'react-router-dom'
import Chat from './Pages/Chat'
import Home from './Pages/Home'


import './App.css'

function App() {

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/chat" element={<Chat />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
