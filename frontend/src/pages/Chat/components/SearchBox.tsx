import { IcSearch } from "./Icons";
import "../styles/SearchBox.css";

export function SearchBox() {
  return (
    <div className="searchbox">
      <IcSearch className="searchbox-icon" />
      <input
        type="text"
        placeholder="Buscar"
        className="searchbox-input"
      />
    </div>
  );
}