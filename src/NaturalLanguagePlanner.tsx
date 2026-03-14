import React, { useState } from 'react';
import { PlannerTask } from './models';
import { getCurrentUser } from './services.db';

interface ParsedTask {
  title: string;
  duration: number;
  originalText: string;
}

interface ScheduleItem {
  startTime: string;
  endTime: string;
  task: ParsedTask;
}

const NaturalLanguagePlanner: React.FC = () => {
  const [input, setInput] = useState<string>('');
  const [deadline, setDeadline] = useState<string>('');
  const [parsedTasks, setParsedTasks] = useState<ParsedTask[]>([]);
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [wakeUpTime, setWakeUpTime] = useState<string>('');
  const [showSchedule, setShowSchedule] = useState<boolean>(false);

  const parseNaturalLanguage = (text: string): ParsedTask[] => {
    const lines = text.split('\n').filter(line => line.trim());
    const tasks: ParsedTask[] = [];
    
    lines.forEach(line => {
      const trimmedLine = line.trim();
      
      // Pattern: "task description duration"
      // Examples: "ordenar la cama 10 min", "barrer 5 min", "meditar 10 min"
      const durationMatch = trimmedLine.match(/(\d+)\s*(?:min|minutes?|mins?)\s*$/i);
      const deadlineMatch = trimmedLine.match(/deadline\s+(\d{1,2}:\d{2})/i);
      
      if (durationMatch) {
        const duration = parseInt(durationMatch[1]);
        const title = trimmedLine.replace(/\d+\s*(?:min|minutes?|mins?)\s*$/i, '').trim();
        
        tasks.push({
          title,
          duration,
          originalText: trimmedLine
        });
      } else if (deadlineMatch) {
        // Handle deadline line separately
        setDeadline(deadlineMatch[1]);
      } else if (trimmedLine.toLowerCase().includes('deadline')) {
        // Try to extract time from deadline line
        const timeMatch = trimmedLine.match(/(\d{1,2}:\d{2})/);
        if (timeMatch) {
          setDeadline(timeMatch[1]);
        }
      }
    });
    
    return tasks;
  };

  const calculateSchedule = () => {
    if (parsedTasks.length === 0) return;
    
    const totalTaskTime = parsedTasks.reduce((sum, task) => sum + task.duration, 0);
    const bufferTime = Math.round(totalTaskTime * 0.1); // 10% buffer time
    const totalTime = totalTaskTime + bufferTime;
    
    // Calculate wake-up time based on deadline or current time
    let targetTime = new Date();
    
    if (deadline) {
      const [hours, minutes] = deadline.split(':').map(Number);
      targetTime.setHours(hours, minutes, 0, 0);
    } else {
      // Default to 8:00 AM if no deadline
      targetTime.setHours(8, 0, 0, 0);
    }
    
    // Calculate wake-up time
    const wakeUpDate = new Date(targetTime.getTime() - (totalTime * 60 * 1000));
    const wakeUpTimeStr = `${wakeUpDate.getHours().toString().padStart(2, '0')}:${wakeUpDate.getMinutes().toString().padStart(2, '0')}`;
    setWakeUpTime(wakeUpTimeStr);
    
    // Generate schedule
    const scheduleItems: ScheduleItem[] = [];
    let currentTime = new Date(wakeUpDate);
    
    parsedTasks.forEach((task, index) => {
      const startTime = `${currentTime.getHours().toString().padStart(2, '0')}:${currentTime.getMinutes().toString().padStart(2, '0')}`;
      
      currentTime = new Date(currentTime.getTime() + (task.duration * 60 * 1000));
      const endTime = `${currentTime.getHours().toString().padStart(2, '0')}:${currentTime.getMinutes().toString().padStart(2, '0')}`;
      
      scheduleItems.push({
        startTime,
        endTime,
        task
      });
      
      // Add small buffer between tasks (except after last task)
      if (index < parsedTasks.length - 1) {
        currentTime = new Date(currentTime.getTime() + (5 * 60 * 1000)); // 5 minute buffer
      }
    });
    
    setSchedule(scheduleItems);
    setShowSchedule(true);
  };

  const handleParse = () => {
    const tasks = parseNaturalLanguage(input);
    setParsedTasks(tasks);
  };

  const handleSaveSchedule = () => {
    const user = getCurrentUser();
    if (!user) return;
    
    const plannerTasks: PlannerTask[] = schedule.map((item, index) => ({
      id: `task_${Date.now()}_${index}`,
      userId: user.id,
      title: item.task.title,
      duration: item.task.duration,
      startTime: item.startTime,
      endTime: item.endTime,
      completed: false,
      date: new Date().toISOString().split('T')[0], // Today's date
      createdAt: new Date(),
    }));
    
    // Save to localStorage
    const existingTasks = JSON.parse(localStorage.getItem(`plannerTasks_${user.id}`) || '[]');
    const updatedTasks = [...existingTasks, ...plannerTasks];
    localStorage.setItem(`plannerTasks_${user.id}`, JSON.stringify(updatedTasks));
    
    alert('Schedule saved successfully!');
  };

  const handleClear = () => {
    setInput('');
    setDeadline('');
    setParsedTasks([]);
    setSchedule([]);
    setWakeUpTime('');
    setShowSchedule(false);
  };

  const totalDuration = parsedTasks.reduce((sum, task) => sum + task.duration, 0);
  const bufferTime = Math.round(totalDuration * 0.1);
  const totalTime = totalDuration + bufferTime;

  return (
    <div className="natural-language-planner">
      <div className="planner-header">
        <h1>Intelligent Daily Planner</h1>
        <p>Enter your tasks in natural language and let AI create your schedule</p>
      </div>

      <div className="input-section">
        <div className="input-group">
          <label htmlFor="task-input">Tasks (one per line):</label>
          <textarea
            id="task-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="ordenar la cama 10 min&#10;barrer 5 min&#10;meditar 10 min&#10;deadline 13:40"
            rows={6}
            className="task-textarea"
          />
        </div>

        <div className="input-group">
          <label htmlFor="deadline">Deadline (optional):</label>
          <input
            id="deadline"
            type="time"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className="deadline-input"
          />
        </div>

        <div className="parse-actions">
          <button 
            className="btn btn-primary"
            onClick={handleParse}
            disabled={!input.trim()}
          >
            Parse Tasks
          </button>
          <button 
            className="btn btn-secondary"
            onClick={handleClear}
          >
            Clear
          </button>
        </div>
      </div>

      {parsedTasks.length > 0 && (
        <div className="parsed-tasks-section">
          <h2>Parsed Tasks</h2>
          <div className="tasks-summary">
            <div className="summary-item">
              <span className="summary-label">Total Tasks:</span>
              <span className="summary-value">{parsedTasks.length}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Total Duration:</span>
              <span className="summary-value">{totalDuration} min</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Buffer Time:</span>
              <span className="summary-value">{bufferTime} min</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Total Time:</span>
              <span className="summary-value">{totalTime} min</span>
            </div>
          </div>
          
          <div className="tasks-list">
            {parsedTasks.map((task, index) => (
              <div key={index} className="parsed-task-item">
                <span className="task-number">{index + 1}</span>
                <span className="task-title">{task.title}</span>
                <span className="task-duration">{task.duration} min</span>
              </div>
            ))}
          </div>

          <button 
            className="btn btn-success"
            onClick={calculateSchedule}
          >
            Generate Schedule
          </button>
        </div>
      )}

      {showSchedule && schedule.length > 0 && (
        <div className="schedule-section">
          <h2>Generated Schedule</h2>
          
          <div className="wake-up-info">
            <div className="wake-up-time">
              <span className="wake-up-label">Recommended Wake-up Time:</span>
              <span className="wake-up-value">{wakeUpTime}</span>
            </div>
          </div>

          <div className="schedule-timeline">
            {schedule.map((item, index) => (
              <div key={index} className="schedule-item">
                <div className="time-slot">
                  <span className="start-time">{item.startTime}</span>
                  <span className="separator">→</span>
                  <span className="end-time">{item.endTime}</span>
                </div>
                <div className="task-details">
                  <span className="task-name">{item.task.title}</span>
                  <span className="task-duration">{item.task.duration} min</span>
                </div>
              </div>
            ))}
          </div>

          <div className="schedule-actions">
            <button 
              className="btn btn-primary"
              onClick={handleSaveSchedule}
            >
              Save Schedule
            </button>
            <button 
              className="btn btn-secondary"
              onClick={() => window.location.href = '/calendar'}
            >
              View Calendar
            </button>
          </div>
        </div>
      )}

      <div className="examples-section">
        <h3>Example Input:</h3>
        <div className="example-code">
          <pre>{`ordenar la cama 10 min
barrer 5 min
meditar 10 min
deadline 13:40`}</pre>
        </div>
      </div>
    </div>
  );
};

export default NaturalLanguagePlanner;
