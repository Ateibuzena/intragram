import "../styles/Sidebar.css";
import { IcChats, IcNewSms, IcRequests } from "./Icons.tsx";
import { SearchBox } from "./SearchBox.tsx";

export default function Sidebar() {
	return (
		<nav className="sidebar">

			<div className="sidebar-top">
				<button className="sidebar-btn"><IcNewSms /></button>
				<SearchBox />           {/* el buscador */}
			</div>

			<div className="sidebar-grid">
				<button><IcChats /></button>
				<button><IcRequests /></button>
			</div>

		</nav>
	);
}