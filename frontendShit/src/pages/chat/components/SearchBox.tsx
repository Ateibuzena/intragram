import '../styles/SearchBox.css';

export function SearchBox() {
    return (
        <div className="search-box">
            <input type="text" placeholder="Search conversations..." className="search-input" />
        </div>
    );
}