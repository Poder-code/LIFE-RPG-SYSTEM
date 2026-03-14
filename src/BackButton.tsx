import React from 'react';
import { useNavigate } from 'react-router-dom';

const BackButton: React.FC = () => {
  const navigate = useNavigate();

  const handleBack = () => {
    // Try to go back in history
    if (window.history.length > 1) {
      window.history.back();
    } else {
      // If no history, navigate to dashboard
      navigate('/');
    }
  };

  return (
    <button 
      onClick={handleBack}
      className="back-btn"
      aria-label="Go back"
    >
      ← Back
    </button>
  );
};

export default BackButton;
