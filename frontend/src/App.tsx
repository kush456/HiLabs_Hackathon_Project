import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import FileUploadPage from './pages/FileUploaderPage';
import AnalyticsDashboard from './pages/AnalyticsDashboard';
import HeroSection from './components/HeroSection';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-teal-50/20">
        <Routes>
          <Route path="/" element={<HeroSection />} />
          <Route path="/upload" element={<FileUploadPage />} />
          <Route path="/dashboard" element={<AnalyticsDashboard />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;