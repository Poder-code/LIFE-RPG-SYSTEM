import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navigation: React.FC = () => {
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const location = useLocation();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const isActive = (path: string): boolean => {
    return location.pathname === path;
  };

  const mainNavItems = [
    { path: '/', label: 'Dashboard', icon: '🏠' },
    { path: '/calendar', label: 'Calendar', icon: '📆' },
    { path: '/diagnostics', label: 'Diagnostics', icon: '🧠' },
    { path: '/progress-map', label: 'Progress', icon: '🗺️' },
  ];

  const allNavItems = [
    { path: '/', label: 'Dashboard', icon: '🏠' },
    { path: '/diagnostics', label: 'Diagnostics', icon: '🧠' },
    { path: '/profile', label: 'Profile', icon: '👤' },
    { path: '/progress-map', label: 'Progress Map', icon: '🗺️' },
    { path: '/calendar', label: 'Calendar', icon: '📆' },
    { path: '/task-breakdown', label: 'Tasks', icon: '✅' },
  ];

  if (isMobile) {
    return (
      <>
        {/* Mobile Bottom Navigation */}
        <nav className="mobile-bottom-nav">
          {mainNavItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`mobile-nav-item ${isActive(item.path) ? 'active' : ''}`}
            >
              <span className="mobile-nav-icon">{item.icon}</span>
              <span className="mobile-nav-label">{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Mobile Hamburger Menu */}
        <div className={`mobile-menu-overlay ${isMenuOpen ? 'open' : ''}`} onClick={() => setIsMenuOpen(false)} />
        <div className={`mobile-menu ${isMenuOpen ? 'open' : ''}`}>
          <div className="mobile-menu-header">
            <div className="nav-brand">
              <span className="brand-icon">⚡</span>
              <span className="brand-name">Life RPG</span>
            </div>
            <button 
              className="mobile-menu-close"
              onClick={() => setIsMenuOpen(false)}
            >
              ×
            </button>
          </div>
          
          <ul className="mobile-nav-list">
            {allNavItems.map(item => (
              <li key={item.path} className="mobile-nav-item-full">
                <Link 
                  to={item.path}
                  className={`mobile-nav-link ${isActive(item.path) ? 'active' : ''}`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <span className="nav-label">{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Hamburger Menu Button */}
        <button 
          className="hamburger-menu"
          onClick={() => setIsMenuOpen(true)}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </>
    );
  }

  return (
    <nav className="main-navigation">
      <div className="nav-container">
        <div className="nav-brand">
          <span className="brand-icon">⚡</span>
          <span className="brand-name">Life RPG</span>
        </div>
        
        <ul className="nav-menu">
          {allNavItems.map(item => (
            <li key={item.path} className="nav-item">
              <Link 
                to={item.path}
                className={`nav-link ${isActive(item.path) ? 'active' : ''}`}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
};

export default Navigation;
