import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import App from './App';
import Diagnostics from './Diagnostics';
import Profile from './Profile';
import ProgressMap from './ProgressMap';
import NaturalLanguagePlanner from './NaturalLanguagePlanner';
import Calendar from './Calendar';
import TaskBreakdown from './TaskBreakdown';

const AppRouter: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/diagnostics" element={<Diagnostics />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/progress-map" element={<ProgressMap />} />
        <Route path="/planner" element={<NaturalLanguagePlanner />} />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/task-breakdown" element={<TaskBreakdown />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

export default AppRouter;
