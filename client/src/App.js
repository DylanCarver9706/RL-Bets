import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './components/Home';

function App() {
  // const [searchTerm, setSearchTerm] = useState('');

  return (
    <>
      {/* <NavBar setSearchTerm={setSearchTerm} /> */}
      <h1>RLBets.com</h1>
      <Routes>
        <Route path="/Home" element={<Home />} />
        {/* <Route path="/RLDataAPI/" element={<AllItems searchTerm={searchTerm} />} /> */}
        {/* <Route path="/RLDataAPI/boosts" element={<Boosts searchTerm={searchTerm} />} /> */}
        {/* <Route path="/RLDataAPI/bodies" element={<Bodies searchTerm={searchTerm} />} /> */}
      </Routes>
    </>
  );
}

export default App;
