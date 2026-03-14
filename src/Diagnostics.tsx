import React, { useState } from 'react';
import { DiagnosticQuestion, DiagnosticResult, ScoreLevel } from './models';
import { useNavigate } from 'react-router-dom';
import BackButton from './BackButton';

const diagnosticQuestions: DiagnosticQuestion[] = [
  // Discipline Questions
  { id: 'd1', category: 'Discipline', question: 'I wake up at the same time every day', weight: 3 },
  { id: 'd2', category: 'Discipline', question: 'I complete my daily tasks without procrastination', weight: 4 },
  { id: 'd3', category: 'Discipline', question: 'I maintain a consistent exercise routine', weight: 3 },
  { id: 'd4', category: 'Discipline', question: 'I avoid distractions during work/study time', weight: 4 },
  { id: 'd5', category: 'Discipline', question: 'I follow through on my commitments', weight: 5 },
  
  // Habits Questions
  { id: 'h1', category: 'Habits', question: 'I have established morning and evening routines', weight: 3 },
  { id: 'h2', category: 'Habits', question: 'I regularly review and update my goals', weight: 4 },
  { id: 'h3', category: 'Habits', question: 'I maintain healthy eating habits', weight: 3 },
  { id: 'h4', category: 'Habits', question: 'I practice mindfulness or meditation regularly', weight: 3 },
  { id: 'h5', category: 'Habits', question: 'I keep my living and working spaces organized', weight: 3 },
  
  // Resilience Questions
  { id: 'r1', category: 'Resilience', question: 'I bounce back quickly from setbacks', weight: 4 },
  { id: 'r2', category: 'Resilience', question: 'I stay calm under pressure', weight: 4 },
  { id: 'r3', category: 'Resilience', question: 'I learn from my mistakes', weight: 5 },
  { id: 'r4', category: 'Resilience', question: 'I adapt well to unexpected changes', weight: 4 },
  { id: 'r5', category: 'Resilience', question: 'I maintain motivation during difficult times', weight: 5 },
  
  // Strategic Mindset Questions
  { id: 's1', category: 'Strategic Mindset', question: 'I think long-term about my goals', weight: 4 },
  { id: 's2', category: 'Strategic Mindset', question: 'I break down complex goals into actionable steps', weight: 5 },
  { id: 's3', category: 'Strategic Mindset', question: 'I regularly assess my progress and adjust strategies', weight: 4 },
  { id: 's4', category: 'Strategic Mindset', question: 'I prioritize tasks based on importance and urgency', weight: 5 },
  { id: 's5', category: 'Strategic Mindset', question: 'I anticipate potential obstacles and plan accordingly', weight: 4 },
];

const Diagnostics: React.FC = () => {
  const [currentCategory, setCurrentCategory] = useState<number>(0);
  const [answers, setAnswers] = useState<{ [key: string]: number }>({});
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [showResults, setShowResults] = useState<boolean>(false);
  const [showSummary, setShowSummary] = useState<boolean>(false);
  const navigate = useNavigate();

  const categories = ['Discipline', 'Habits', 'Resilience', 'Strategic Mindset'];
  
  const getScoreLevel = (score: number): ScoreLevel => {
    if (score <= 25) return 'Low';
    if (score <= 50) return 'Medium';
    if (score <= 75) return 'High';
    return 'Elite';
  };

  const calculateCategoryScore = (category: string): number => {
    const categoryQuestions = diagnosticQuestions.filter(q => q.category === category);
    const totalWeight = categoryQuestions.reduce((sum, q) => sum + q.weight, 0);
    const earnedScore = categoryQuestions.reduce((sum, q) => {
      const answer = answers[q.id] || 0;
      return sum + (answer * q.weight);
    }, 0);
    
    return Math.round((earnedScore / (totalWeight * 5)) * 100);
  };

  const handleAnswer = (questionId: string, value: number) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const nextCategory = () => {
    if (currentCategory < categories.length - 1) {
      setCurrentCategory(prev => prev + 1);
    }
  };

  const previousCategory = () => {
    if (currentCategory > 0) {
      setCurrentCategory(prev => prev - 1);
    }
  };

  const submitEvaluation = () => {
    const evaluationResults: DiagnosticResult[] = categories.map(category => ({
      category,
      score: calculateCategoryScore(category),
      level: getScoreLevel(calculateCategoryScore(category)),
      answers: diagnosticQuestions
        .filter(q => q.category === category)
        .map(q => ({ questionId: q.id, answer: answers[q.id] || 0 }))
    }));
    
    setResults(evaluationResults);
    setShowResults(true);
  };

  const goToSummary = () => {
    setShowSummary(true);
  };

  const getProfileSummary = (results: DiagnosticResult[]) => {
    const strengths: string[] = [];
    const improvements: string[] = [];
    const suggestions: string[] = [];

    results.forEach(result => {
      if (result.level === 'High' || result.level === 'Elite') {
        strengths.push(`${result.category}`);
      } else {
        improvements.push(`${result.category}`);
      }
    });

    if (improvements.includes('Discipline')) {
      suggestions.push('Create consistent morning and evening routines');
      suggestions.push('Use time-blocking for better focus');
    }
    if (improvements.includes('Strategic Mindset')) {
      suggestions.push('Create weekly planning sessions');
      suggestions.push('Break down long-term goals into smaller steps');
    }
    if (improvements.includes('Resilience')) {
      suggestions.push('Practice stress management techniques');
      suggestions.push('Develop a growth mindset approach');
    }
    if (improvements.includes('Habits')) {
      suggestions.push('Start with one small habit at a time');
      suggestions.push('Use habit tracking for accountability');
    }

    return { strengths, improvements, suggestions };
  };

  const getScoreColor = (level: ScoreLevel): string => {
    switch (level) {
      case 'Low': return '#ef4444';
      case 'Medium': return '#f59e0b';
      case 'High': return '#10b981';
      case 'Elite': return '#8b5cf6';
      default: return '#6b7280';
    }
  };

  if (showSummary) {
    const summary = getProfileSummary(results);
    
    return (
      <div className="diagnostics-container">
        <BackButton />
        <div className="diagnostics-header">
          <button 
            className="back-btn"
            onClick={() => setShowSummary(false)}
          >
            ← Back to Results
          </button>
          <h1>Profile Summary</h1>
          <p>Your personalized development roadmap based on evaluation results</p>
        </div>
        
        <div className="summary-content">
          <div className="summary-section">
            <h2>Strengths</h2>
            {summary.strengths.length > 0 ? (
              <ul className="summary-list">
                {summary.strengths.map((strength, index) => (
                  <li key={index} className="strength-item">
                    <span className="check-icon">✓</span>
                    Strong {strength}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="empty-message">Continue developing your foundation areas.</p>
            )}
          </div>
          
          <div className="summary-section">
            <h2>Areas to Improve</h2>
            {summary.improvements.length > 0 ? (
              <ul className="summary-list">
                {summary.improvements.map((improvement, index) => (
                  <li key={index} className="improvement-item">
                    <span className="arrow-icon">→</span>
                    {improvement}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="empty-message">Excellent! You're well-balanced across all areas.</p>
            )}
          </div>
          
          <div className="summary-section">
            <h2>Suggested Improvements</h2>
            {summary.suggestions.length > 0 ? (
              <ul className="summary-list">
                {summary.suggestions.map((suggestion, index) => (
                  <li key={index} className="suggestion-item">
                    <span className="bullet-icon">•</span>
                    {suggestion}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="empty-message">Focus on maintaining your current excellent habits.</p>
            )}
          </div>
        </div>
        
        <div className="summary-actions">
          <button 
            className="btn btn-primary"
            onClick={() => navigate('/progress-map')}
          >
            View Progress Map
          </button>
          <button 
            className="btn btn-secondary"
            onClick={() => {
              setShowSummary(false);
              setShowResults(false);
              setAnswers({});
              setCurrentCategory(0);
            }}
          >
            Retake Evaluation
          </button>
        </div>
      </div>
    );
  }

  if (showResults) {
    return (
      <div className="diagnostics-container">
        <BackButton />
        <div className="diagnostics-header">
          <button 
            className="back-btn"
            onClick={() => navigate('/')}
          >
            ← Back to Dashboard
          </button>
          <h1>Personal Development Evaluation Results</h1>
          <p>Your comprehensive assessment across all development areas</p>
        </div>
        
        <div className="results-grid">
          {results.map(result => (
            <div key={result.category} className="result-card">
              <h3>{result.category}</h3>
              <div className="score-display">
                <div 
                  className="score-circle"
                  style={{ borderColor: getScoreColor(result.level) }}
                >
                  <span style={{ color: getScoreColor(result.level) }}>
                    {result.score}
                  </span>
                </div>
                <span className="score-level" style={{ color: getScoreColor(result.level) }}>
                  {result.level}
                </span>
              </div>
              <div className="score-bar">
                <div 
                  className="score-fill"
                  style={{ 
                    width: `${result.score}%`,
                    backgroundColor: getScoreColor(result.level)
                  }}
                />
              </div>
            </div>
          ))}
        </div>
        
        <div className="results-actions">
          <button 
            className="btn btn-secondary"
            onClick={() => navigate('/')}
          >
            Back to Dashboard
          </button>
          <button 
            className="btn btn-primary"
            onClick={goToSummary}
          >
            View Summary
          </button>
          <button 
            className="btn btn-secondary"
            onClick={() => {
              setShowResults(false);
              setAnswers({});
              setCurrentCategory(0);
            }}
          >
            Retake Evaluation
          </button>
        </div>
      </div>
    );
  }

  const currentCategoryName = categories[currentCategory];
  const categoryQuestions = diagnosticQuestions.filter(q => q.category === currentCategoryName);
  const isCategoryComplete = categoryQuestions.every(q => answers[q.id] !== undefined);

  return (
    <div className="diagnostics-container">
      <BackButton />
      <div className="diagnostics-header">
        <button 
          className="back-btn"
          onClick={() => navigate('/')}
        >
          ← Back to Dashboard
        </button>
        <h1>Personal Development Evaluation</h1>
        <p>Assess your skills across key areas of personal growth</p>
      </div>

      <div className="progress-indicator">
        {categories.map((category, index) => (
          <div 
            key={category}
            className={`progress-step ${index <= currentCategory ? 'active' : ''} ${index < currentCategory ? 'completed' : ''}`}
          >
            <div className="step-number">{index + 1}</div>
            <div className="step-label">{category}</div>
          </div>
        ))}
      </div>

      <div className="category-section">
        <h2>{currentCategoryName}</h2>
        <p>Rate each statement on a scale of 1 (Strongly Disagree) to 5 (Strongly Agree)</p>
        
        <div className="questions-list">
          {categoryQuestions.map(question => (
            <div key={question.id} className="question-item">
              <p className="question-text">{question.question}</p>
              <div className="answer-options">
                {[1, 2, 3, 4, 5].map(value => (
                  <button
                    key={value}
                    className={`answer-btn ${answers[question.id] === value ? 'selected' : ''}`}
                    onClick={() => handleAnswer(question.id, value)}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="navigation-buttons">
        <button 
          className="btn btn-secondary"
          onClick={previousCategory}
          disabled={currentCategory === 0}
        >
          Previous
        </button>
        
        {currentCategory < categories.length - 1 ? (
          <button 
            className="btn btn-primary"
            onClick={nextCategory}
            disabled={!isCategoryComplete}
          >
            Next Category
          </button>
        ) : (
          <button 
            className="btn btn-primary"
            onClick={submitEvaluation}
            disabled={!isCategoryComplete}
          >
            Complete Evaluation
          </button>
        )}
      </div>
    </div>
  );
};

export default Diagnostics;
