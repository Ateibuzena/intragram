import { Routes, Route, BrowserRouter } from 'react-router-dom'
import Login from './Pages/Login/Login'
import Chat from './Pages/Chat'

import './App.css'

function App() {

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/chat" element={<Chat />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
