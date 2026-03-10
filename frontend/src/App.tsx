import { BrowserRouter, Routes, Route } from 'react-router-dom'

import Chat from './pages/chat/Chat.tsx'

export default function App()
{
	return (
		<BrowserRouter>
			<Routes>
				<Route path="/chat" element={<Chat />} />
			</Routes>
		</BrowserRouter>
	)
}
