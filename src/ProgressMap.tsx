import React, { useState, useEffect } from 'react';
import { ProgressMap as ProgressMapType, ProgressLevel } from './models';
import { getCurrentUser } from './services.db';
import BackButton from './BackButton';

const ProgressMap: React.FC = () => {
  const [progressMap, setProgressMap] = useState<ProgressMapType | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const getLevelIcon = (level: ProgressLevel): string => {
    switch (level) {
      case 1: return '🌱';
      case 2: return '🌿';
      case 3: return '🌳';
      case 4: return '🏆';
      case 5: return '⭐';
      default: return '🌱';
    }
  };

  const getLevelColor = (level: ProgressLevel): string => {
    switch (level) {
      case 1: return '#ef4444'; // Red
      case 2: return '#f59e0b'; // Orange
      case 3: return '#3b82f6'; // Blue
      case 4: return '#10b981'; // Green
      case 5: return '#8b5cf6'; // Purple
      default: return '#6b7280'; // Gray
    }
  };

  const getLevelName = (level: ProgressLevel): string => {
    switch (level) {
      case 1: return 'Disorganization';
      case 2: return 'Basic Control';
      case 3: return 'Consistency';
      case 4: return 'Optimization';
      case 5: return 'Mastery';
      default: return 'Unknown';
    }
  };

  const calculateTotalLevel = (areas: ProgressMapType['areas']): number => {
    const levels = Object.values(areas);
    const sum = levels.reduce((acc, level) => acc + level, 0);
    return Math.round(sum / levels.length);
  };

  
  useEffect(() => {
    const loadProgressMap = async () => {
      const user = getCurrentUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // Try to load existing progress map from localStorage
      const savedMap = localStorage.getItem(`progressMap_${user.id}`);
      
      if (savedMap) {
        setProgressMap(JSON.parse(savedMap));
      } else {
        // Load from profile or create default
        const savedProfile = localStorage.getItem(`profile_${user.id}`);
        
        if (savedProfile) {
          const profile = JSON.parse(savedProfile);
          const newProgressMap: ProgressMapType = {
            userId: user.id,
            areas: {
              discipline: profile.disciplineLevel || 1,
              habits: profile.habitsLevel || 1,
              resilience: profile.resilienceLevel || 1,
              strategy: profile.strategyLevel || 1,
              execution: profile.executionLevel || 1,
            },
            totalLevel: 0,
            unlockedAreas: [],
          };
          
          newProgressMap.totalLevel = calculateTotalLevel(newProgressMap.areas);
          newProgressMap.unlockedAreas = Object.entries(newProgressMap.areas)
            .filter(([_, level]) => level >= 2)
            .map(([area]) => area);
          
          setProgressMap(newProgressMap);
          localStorage.setItem(`progressMap_${user.id}`, JSON.stringify(newProgressMap));
        }
      }
      
      setLoading(false);
    };

    loadProgressMap();
  }, []);

  if (loading) {
    return <div className="loading">Loading your progress map...</div>;
  }

  if (!progressMap) {
    return (
      <div className="progress-map-container">
        <div className="no-map">
          <h2>No Progress Data Available</h2>
          <p>Please complete the diagnostic evaluation to generate your progress map.</p>
          <button 
            className="btn btn-primary"
            onClick={() => window.location.href = '/diagnostics'}
          >
            Take Evaluation
          </button>
        </div>
      </div>
    );
  }

  const areas = [
    { key: 'discipline', name: 'Discipline', icon: '⚡', description: 'Consistency and self-control' },
    { key: 'habits', name: 'Habits', icon: '🔄', description: 'Daily routines and systems' },
    { key: 'resilience', name: 'Resilience', icon: '🛡️', description: 'Mental toughness and adaptability' },
    { key: 'strategy', name: 'Strategy', icon: '🎯', description: 'Planning and strategic thinking' },
    { key: 'execution', name: 'Execution', icon: '🚀', description: 'Getting things done effectively' },
  ];

  return (
    <div className="progress-map-container">
      <BackButton />
      <div className="progress-map-header">
        <h1>Your Personal Development Map</h1>
        <p>Visual representation of your growth across key life areas</p>
        
        <div className="overall-progress">
          <div className="overall-level">
            <span className="level-number">{progressMap.totalLevel}</span>
            <span className="level-label">Overall Level</span>
          </div>
          <div className="overall-bar">
            <div 
              className="overall-fill"
              style={{ 
                width: `${(progressMap.totalLevel / 5) * 100}%`,
                backgroundColor: getLevelColor(progressMap.totalLevel as ProgressLevel)
              }}
            />
          </div>
        </div>
      </div>

      <div className="progress-zones">
        <h2>Development Zones</h2>
        <div className="zones-grid">
          {areas.map(area => {
            const level = progressMap.areas[area.key as keyof typeof progressMap.areas];
            const isUnlocked = level >= 2;
            
            return (
              <div 
                key={area.key} 
                className={`zone-card ${isUnlocked ? 'unlocked' : 'locked'}`}
                style={{ 
                  borderColor: getLevelColor(level),
                  backgroundColor: isUnlocked ? `${getLevelColor(level)}10` : '#f3f4f6'
                }}
              >
                <div className="zone-header">
                  <div className="zone-icon">{area.icon}</div>
                  <div className="zone-title">
                    <h3>{area.name}</h3>
                    <div className="zone-level">
                      <span className="level-icon">{getLevelIcon(level)}</span>
                      <span className="level-text">Level {level}</span>
                    </div>
                  </div>
                </div>
                
                <div className="zone-description">
                  <p>{area.description}</p>
                </div>
                
                <div className="zone-progress">
                  <div className="progress-levels">
                    {[1, 2, 3, 4, 5].map(lvl => (
                      <div 
                        key={lvl}
                        className={`progress-level ${lvl <= level ? 'completed' : 'incomplete'}`}
                        style={{ 
                          backgroundColor: lvl <= level ? getLevelColor(lvl as ProgressLevel) : '#e5e7eb'
                        }}
                        title={getLevelName(lvl as ProgressLevel)}
                      >
                        {lvl}
                      </div>
                    ))}
                  </div>
                  <div className="level-name">{getLevelName(level)}</div>
                </div>
                
                {isUnlocked && (
                  <div className="zone-status">
                    <span className="status-badge unlocked">✓ Unlocked</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="progress-actions">
        <button 
          className="btn btn-secondary"
          onClick={() => window.location.href = '/profile'}
        >
          View Profile
        </button>
        <button 
          className="btn btn-primary"
          onClick={() => window.location.href = '/diagnostics'}
        >
          Update Progress
        </button>
      </div>
    </div>
  );
};

export default ProgressMap;
