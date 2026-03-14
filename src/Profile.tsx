import React, { useState, useEffect } from 'react';
import { UserProfile, DiagnosticResult, ProductiveMindType, ProgressLevel } from './models';
import { getCurrentUser } from './services.db';
import BackButton from './BackButton';

interface ProfileProps {
  diagnosticResults?: DiagnosticResult[];
}

const Profile: React.FC<ProfileProps> = ({ diagnosticResults }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const classifyMindType = (results: DiagnosticResult[]): ProductiveMindType => {
    const scores = {
      discipline: results.find(r => r.category === 'Discipline')?.score || 0,
      habits: results.find(r => r.category === 'Habits')?.score || 0,
      resilience: results.find(r => r.category === 'Resilience')?.score || 0,
      strategy: results.find(r => r.category === 'Strategic Mindset')?.score || 0,
    };

    // Classification logic
    if (scores.discipline >= 70 && scores.habits >= 70) {
      return 'Executor';
    }
    if (scores.strategy >= 70 && scores.discipline >= 50) {
      return 'Strategist';
    }
    if (scores.habits >= 70 && scores.resilience >= 60) {
      return 'Builder';
    }
    if (scores.resilience >= 70 && scores.strategy >= 50) {
      return 'Explorer';
    }
    
    // Default classification based on highest score
    const highestScore = Math.max(...Object.values(scores));
    const highestCategory = Object.entries(scores).find(([_, score]) => score === highestScore)?.[0];
    
    switch (highestCategory) {
      case 'discipline': return 'Executor';
      case 'strategy': return 'Strategist';
      case 'habits': return 'Builder';
      case 'resilience': return 'Explorer';
      default: return 'Executor';
    }
  };

  const getProgressLevel = (score: number): ProgressLevel => {
    if (score <= 20) return 1; // Disorganization
    if (score <= 40) return 2; // Basic Control
    if (score <= 60) return 3; // Consistency
    if (score <= 80) return 4; // Optimization
    return 5; // Mastery
  };

  const generateRecommendations = (mindType: ProductiveMindType, scores: { [key: string]: number }): string[] => {
    const recommendations: string[] = [];
    
    // Mind type specific recommendations
    switch (mindType) {
      case 'Executor':
        recommendations.push('Focus on strategic planning to complement your execution skills');
        recommendations.push('Take time to reflect on long-term goals');
        recommendations.push('Balance intense work periods with adequate recovery');
        break;
      case 'Strategist':
        recommendations.push('Convert your strategic plans into daily actionable tasks');
        recommendations.push('Set specific deadlines for your strategic initiatives');
        recommendations.push('Practice quick decision-making for smaller matters');
        break;
      case 'Builder':
        recommendations.push('Challenge yourself with more ambitious projects');
        recommendations.push('Develop systems to scale your habits');
        recommendations.push('Share your knowledge and mentor others');
        break;
      case 'Explorer':
        recommendations.push('Create structure to channel your adaptability');
        recommendations.push('Set consistent routines to support your exploratory nature');
        recommendations.push('Balance new experiences with focused execution');
        break;
    }
    
    // Score-based recommendations
    Object.entries(scores).forEach(([area, score]) => {
      if (score < 50) {
        switch (area) {
          case 'discipline':
            recommendations.push('Establish a consistent morning routine');
            recommendations.push('Use time-blocking to improve focus');
            break;
          case 'habits':
            recommendations.push('Start with small, consistent daily habits');
            recommendations.push('Use habit-tracking apps to monitor progress');
            break;
          case 'resilience':
            recommendations.push('Practice mindfulness and stress management');
            recommendations.push('Reframe setbacks as learning opportunities');
            break;
          case 'strategy':
            recommendations.push('Set clear long-term goals');
            recommendations.push('Break down goals into quarterly objectives');
            break;
        }
      }
    });
    
    return recommendations;
  };

  useEffect(() => {
    const loadProfile = async () => {
      const user = getCurrentUser();
      if (!user) {
        setLoading(false);
        return;
      }

      if (diagnosticResults && diagnosticResults.length > 0) {
        const mindType = classifyMindType(diagnosticResults);
        const scores = {
          discipline: diagnosticResults.find(r => r.category === 'Discipline')?.score || 0,
          habits: diagnosticResults.find(r => r.category === 'Habits')?.score || 0,
          resilience: diagnosticResults.find(r => r.category === 'Resilience')?.score || 0,
          strategy: diagnosticResults.find(r => r.category === 'Strategic Mindset')?.score || 0,
        };

        const newProfile: UserProfile = {
          id: `profile_${user.id}`,
          userId: user.id,
          disciplineScore: scores.discipline,
          resilienceScore: scores.resilience,
          habitsScore: scores.habits,
          strategyScore: scores.strategy,
          mindType,
          disciplineLevel: getProgressLevel(scores.discipline),
          resilienceLevel: getProgressLevel(scores.resilience),
          habitsLevel: getProgressLevel(scores.habits),
          strategyLevel: getProgressLevel(scores.strategy),
          executionLevel: getProgressLevel((scores.discipline + scores.habits) / 2),
          recommendations: generateRecommendations(mindType, scores),
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        setProfile(newProfile);
        
        // Save to localStorage for persistence
        localStorage.setItem(`profile_${user.id}`, JSON.stringify(newProfile));
      } else {
        // Load existing profile from localStorage
        const savedProfile = localStorage.getItem(`profile_${user.id}`);
        if (savedProfile) {
          setProfile(JSON.parse(savedProfile));
        }
      }
      
      setLoading(false);
    };

    loadProfile();
  }, [diagnosticResults]);

  const getMindTypeDescription = (mindType: ProductiveMindType): string => {
    switch (mindType) {
      case 'Executor':
        return 'You excel at getting things done. Your strength lies in consistent execution and turning plans into reality.';
      case 'Strategist':
        return 'You have a natural talent for planning and seeing the big picture. Your strategic thinking helps you navigate complex challenges.';
      case 'Builder':
        return 'You are skilled at creating systems and building lasting habits. Your methodical approach creates sustainable progress.';
      case 'Explorer':
        return 'You thrive on adaptability and continuous learning. Your curiosity and resilience help you navigate uncertainty.';
      default:
        return '';
    }
  };

  const getLevelLabel = (level: ProgressLevel): string => {
    switch (level) {
      case 1: return 'Disorganization';
      case 2: return 'Basic Control';
      case 3: return 'Consistency';
      case 4: return 'Optimization';
      case 5: return 'Mastery';
      default: return '';
    }
  };

  const getLevelColor = (level: ProgressLevel): string => {
    switch (level) {
      case 1: return '#ef4444';
      case 2: return '#f59e0b';
      case 3: return '#3b82f6';
      case 4: return '#10b981';
      case 5: return '#8b5cf6';
      default: return '#6b7280';
    }
  };

  if (loading) {
    return <div className="loading">Loading your profile...</div>;
  }

  if (!profile) {
    return (
      <div className="profile-container">
        <div className="no-profile">
          <h2>No Profile Data Available</h2>
          <p>Please complete the diagnostic evaluation to generate your personal profile.</p>
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

  return (
    <div className="profile-container">
      <BackButton />
      <div className="profile-header">
        <h1>Personal Development Profile</h1>
        <p>Your comprehensive psychological and productivity profile</p>
      </div>

      <div className="mind-type-section">
        <div className="mind-type-card">
          <h2>Your Productive Mind Type</h2>
          <div className="mind-type-display">
            <span className="mind-type-name">{profile.mindType}</span>
            <div className="mind-type-icon">
              {profile.mindType === 'Executor' && '⚡'}
              {profile.mindType === 'Strategist' && '🎯'}
              {profile.mindType === 'Builder' && '🏗️'}
              {profile.mindType === 'Explorer' && '🧭'}
            </div>
          </div>
          <p className="mind-type-description">
            {getMindTypeDescription(profile.mindType)}
          </p>
        </div>
      </div>

      <div className="scores-grid">
        <div className="score-card">
          <h3>Discipline</h3>
          <div className="score-display">
            <span className="score-value">{profile.disciplineScore}</span>
            <span className="score-level" style={{ color: getLevelColor(profile.disciplineLevel) }}>
              {getLevelLabel(profile.disciplineLevel)}
            </span>
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ 
                width: `${profile.disciplineScore}%`,
                backgroundColor: getLevelColor(profile.disciplineLevel)
              }}
            />
          </div>
        </div>

        <div className="score-card">
          <h3>Resilience</h3>
          <div className="score-display">
            <span className="score-value">{profile.resilienceScore}</span>
            <span className="score-level" style={{ color: getLevelColor(profile.resilienceLevel) }}>
              {getLevelLabel(profile.resilienceLevel)}
            </span>
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ 
                width: `${profile.resilienceScore}%`,
                backgroundColor: getLevelColor(profile.resilienceLevel)
              }}
            />
          </div>
        </div>

        <div className="score-card">
          <h3>Habits</h3>
          <div className="score-display">
            <span className="score-value">{profile.habitsScore}</span>
            <span className="score-level" style={{ color: getLevelColor(profile.habitsLevel) }}>
              {getLevelLabel(profile.habitsLevel)}
            </span>
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ 
                width: `${profile.habitsScore}%`,
                backgroundColor: getLevelColor(profile.habitsLevel)
              }}
            />
          </div>
        </div>

        <div className="score-card">
          <h3>Strategic Mindset</h3>
          <div className="score-display">
            <span className="score-value">{profile.strategyScore}</span>
            <span className="score-level" style={{ color: getLevelColor(profile.strategyLevel) }}>
              {getLevelLabel(profile.strategyLevel)}
            </span>
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ 
                width: `${profile.strategyScore}%`,
                backgroundColor: getLevelColor(profile.strategyLevel)
              }}
            />
          </div>
        </div>
      </div>

      <div className="recommendations-section">
        <h2>Personalized Recommendations</h2>
        <div className="recommendations-list">
          {profile.recommendations.map((recommendation, index) => (
            <div key={index} className="recommendation-item">
              <span className="recommendation-number">{index + 1}</span>
              <span className="recommendation-text">{recommendation}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="profile-actions">
        <button 
          className="btn btn-secondary"
          onClick={() => window.location.href = '/progress-map'}
        >
          View Progress Map
        </button>
        <button 
          className="btn btn-primary"
          onClick={() => window.location.href = '/diagnostics'}
        >
          Retake Evaluation
        </button>
      </div>
    </div>
  );
};

export default Profile;
