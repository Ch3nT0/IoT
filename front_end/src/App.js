import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import ActionHistory from './pages/ActionHistory';
import SensorData from './pages/SensorData';


function App() {
  return (
    <Router>
      <div className="flex min-h-screen bg-slate-100">
        <Sidebar />
        <div className="flex-grow">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/sensors" element={<SensorData />} />
            <Route path="/history" element={<ActionHistory />} />
            <Route path="/profile" element={<Profile />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;