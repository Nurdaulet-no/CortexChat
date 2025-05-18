// src/components/SearchBar.jsx
import React, { useState } from 'react';

function SearchBar({ onSearch }) {
  const [searchTerm, setSearchTerm] = useState('');

  const handleChange = (e) => {
    setSearchTerm(e.target.value);
    // For now, search is triggered by Enter or an explicit button (if you add one)
  };

  const handleSearchSubmit = (e) => {
      e.preventDefault(); // Prevent default if it's a form
      if (onSearch) { // Call the onSearch prop if provided
          onSearch(searchTerm);
      }
  };

  return (
    // These class names should match your chat-layout.css
    <div className="search-container">
      <form onSubmit={handleSearchSubmit} style={{ width: '100%' }}> {/* Use form for Enter key submission */}
        <div className="search-box">
          <i className="fas fa-search search-icon"></i>
          <input
            type="text"
            placeholder="Поиск" // Search in Russian
            className="search-input"
            value={searchTerm}
            onChange={handleChange}
            // No need for onKeyPress here if using form onSubmit
          />
          {/* You could add an explicit search button here if desired */}
          {/* <button type="submit">Search</button> */}
        </div>
      </form>
    </div>
  );
}

export default SearchBar;