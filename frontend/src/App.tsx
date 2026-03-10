import { BrowserRouter, Routes, Route } from "react-router-dom";

import Navbar from "./common/components/Navbar.tsx";
import Footer from "./common/components/Footer.tsx";

import Home from "./pages/Home/Home.tsx";
import Chat from "./pages/Chat/Chat.tsx";

export default function App() {
  return (
	<BrowserRouter>

		<Navbar />

		<main>
			<Routes>
				<Route path="/" element={<Home />} />
				<Route path="/chat" element={<Chat />} />
			</Routes>
		</main>

		<Footer />

	</BrowserRouter>
  );
}
