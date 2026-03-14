import React, { useState } from 'react';

interface Task {
  name: string;
  duration: number;
}

interface GeneratedSchedule {
  tasks: Array<{
    time: string;
    name: string;
  }>;
  totalDuration: number;
  wakeUpSuggestion?: string;
  remainingTime: number;
}

const QuickPlanner: React.FC = () => {
  const [currentTime, setCurrentTime] = useState('10:30');
  const [availableUntil, setAvailableUntil] = useState('13:40');
  const [taskList, setTaskList] = useState('');
  const [generatedSchedule, setGeneratedSchedule] = useState<GeneratedSchedule | null>(null);

  const parseTimeToMinutes = (timeStr: string): number => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const formatMinutesToTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  const parseTaskList = (input: string): Task[] => {
    const lines = input.trim().split('\n');
    const tasks: Task[] = [];
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;
      
      // Parse "task_name duration" format
      const match = trimmedLine.match(/^(.+?)\s+(\d+)$/);
      if (match) {
        const name = match[1].trim();
        const duration = parseInt(match[2], 10);
        if (name && duration > 0) {
          tasks.push({ name, duration });
        }
      }
    }
    
    return tasks;
  };

  const generateSchedule = () => {
    const tasks = parseTaskList(taskList);
    if (tasks.length === 0) {
      alert('Please enter at least one task with duration');
      return;
    }

    const currentMinutes = parseTimeToMinutes(currentTime);
    const deadlineMinutes = parseTimeToMinutes(availableUntil);
    const totalTaskDuration = tasks.reduce((sum, task) => sum + task.duration, 0);

    // Calculate wake-up suggestion if needed
    let wakeUpSuggestion: string | undefined;
    if (currentMinutes < deadlineMinutes && totalTaskDuration > (deadlineMinutes - currentMinutes)) {
      const suggestedWakeUp = deadlineMinutes - totalTaskDuration;
      if (suggestedWakeUp > 0) {
        wakeUpSuggestion = `You should wake up at ${formatMinutesToTime(suggestedWakeUp)} to complete all tasks before ${availableUntil}.`;
      }
    }

    // Generate timeline
    const scheduleTasks = [];
    let currentTimeMinutes = Math.max(currentMinutes, deadlineMinutes - totalTaskDuration);
    
    for (const task of tasks) {
      const startTime = formatMinutesToTime(currentTimeMinutes);
      scheduleTasks.push({
        time: startTime,
        name: task.name
      });
      currentTimeMinutes += task.duration;
    }

    const remainingTime = deadlineMinutes - currentTimeMinutes;

    setGeneratedSchedule({
      tasks: scheduleTasks,
      totalDuration: totalTaskDuration,
      wakeUpSuggestion,
      remainingTime
    });
  };

  const clearPlanner = () => {
    setTaskList('');
    setGeneratedSchedule(null);
  };

  return (
    <div className="quick-planner">
      <div className="quick-planner-header">
        <h3>Quick Planner</h3>
        <p>Generate an automatic schedule from your task list</p>
      </div>

      <div className="planner-inputs">
        <div className="input-group">
          <label htmlFor="current-time">Current Time</label>
          <input
            id="current-time"
            type="time"
            value={currentTime}
            onChange={(e) => setCurrentTime(e.target.value)}
            className="time-input"
          />
        </div>

        <div className="input-group">
          <label htmlFor="available-until">Available Until</label>
          <input
            id="available-until"
            type="time"
            value={availableUntil}
            onChange={(e) => setAvailableUntil(e.target.value)}
            className="time-input"
          />
        </div>

        <div className="input-group">
          <label htmlFor="task-list">Task List</label>
          <textarea
            id="task-list"
            value={taskList}
            onChange={(e) => setTaskList(e.target.value)}
            placeholder="ordenar cama 10&#10;barrer 5&#10;bañarme 5&#10;afeitarme 7&#10;mascarilla 15&#10;meditar 10&#10;preparar cosas 20&#10;comida pre entreno 30&#10;sacar auto 5"
            className="task-textarea"
            rows={8}
          />
          <small className="input-hint">
            Enter each task followed by its duration in minutes (one per line)
          </small>
        </div>
      </div>

      <div className="planner-actions">
        <button 
          onClick={generateSchedule}
          className="btn btn-primary"
          disabled={!taskList.trim()}
        >
          Generate Plan
        </button>
        <button 
          onClick={clearPlanner}
          className="btn btn-secondary"
        >
          Clear
        </button>
      </div>

      {generatedSchedule && (
        <div className="generated-schedule">
          <div className="schedule-header">
            <h4>Generated Schedule</h4>
            <div className="schedule-summary">
              <p>Total duration: <strong>{Math.floor(generatedSchedule.totalDuration / 60)}h {generatedSchedule.totalDuration % 60}m</strong></p>
              <p>Remaining time: <strong>{Math.floor(Math.max(0, generatedSchedule.remainingTime) / 60)}h {Math.max(0, generatedSchedule.remainingTime) % 60}m</strong></p>
            </div>
          </div>

          {generatedSchedule.wakeUpSuggestion && (
            <div className="wake-up-suggestion">
              <strong>💡 {generatedSchedule.wakeUpSuggestion}</strong>
            </div>
          )}

          <div className="schedule-timeline">
            {generatedSchedule.tasks.map((task, index) => (
              <div key={index} className="schedule-item">
                <span className="schedule-time">{task.time}</span>
                <span className="task-name">{task.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default QuickPlanner;
